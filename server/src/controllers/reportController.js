import XLSX from "xlsx";
import stream from "stream";
import csv from "csv-parser";
import JSZip from "jszip";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

import UserReport from "../models/reportModel.js";
import UserUpload from "../models/uploadModel.js";
import { createHistory } from "../services/historyService.js";
import { generateUniqueFileName, DEFAULT_PROMPT } from "../utils/helpers.js";
import { generateAIReport } from "../services/geminiService.js";

/* ------------------------ قراءة معاينة الملف ------------------------ */
const readFilePreview = async (fileBuffer, mimeType, maxRows = 15) => {
  if (mimeType.includes("csv")) {
    return new Promise((resolve, reject) => {
      const rows = [];
      const readable = new stream.Readable();
      readable._read = () => {};
      readable.push(fileBuffer);
      readable.push(null);

      readable
        .pipe(csv())
        .on("data", (data) => {
          if (rows.length < maxRows) rows.push(data);
        })
        .on("end", () => resolve(rows))
        .on("error", reject);
    });
  } else if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    return data.slice(0, maxRows);
  } else {
    const text = fileBuffer.toString("utf8");
    return text.slice(0, 2000);
  }
};

/* ------------------------ إنشاء PDF ------------------------ */
const createPDF = (data, title, description, outputFilePath) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const writeStream = fs.createWriteStream(outputFilePath);
    doc.pipe(writeStream);

    doc.fontSize(16).text(title, { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(description, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown();

    data.forEach((row, index) => {
      doc.fontSize(12).text(`Row ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) =>
        doc.text(`${key}: ${value}`)
      );
      doc.moveDown();
    });

    doc.end();
    writeStream.on("finish", () => resolve(outputFilePath));
    writeStream.on("error", (err) => reject(err));
  });

/* ------------------------ توليد التقرير ------------------------ */
export const generateReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const file = req.file;
    if (!file)
      return res
        .status(400)
        .json({ success: false, message: "File is required" });

    let { prompt } = req.body;
    prompt = prompt?.trim() || DEFAULT_PROMPT;

    // قراءة المعاينة من الملف المرفوع
    const previewData = await readFilePreview(file.buffer, file.mimetype);

    // إرسال المعاينة للـ AI
    const aiSummary = await generateAIReport(prompt, previewData);
    const finalData = [...previewData, { AI_Summary: aiSummary }];

    // إنشاء PDF
    const reportTitle = "AI Generated Report";
    const reportDescription = `Report based on prompt: ${prompt}`;
    const pdfFileName = generateUniqueFileName("report.pdf");
    const reportsDir = "uploads/reports";
    if (!fs.existsSync(reportsDir))
      fs.mkdirSync(reportsDir, { recursive: true });
    const pdfFilePath = path.join(reportsDir, pdfFileName);
    await createPDF(finalData, reportTitle, reportDescription, pdfFilePath);

    // ضغط الملف قبل الحفظ
    const zip = new JSZip();
    zip.file(file.originalname, file.buffer);
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // حفظ الملف المضغوط في قاعدة البيانات
    const uploaded = await UserUpload.create({
      user_id: userId,
      file_name: file.originalname,
      file_type: "application/zip",
      file_data: zipBuffer,
    });

    // حفظ التقرير وربطه بالملف المضغوط
    const report = await UserReport.create({
      user_id: userId,
      report_title: reportTitle,
      report_prompt: reportDescription,
      pdf_path: pdfFilePath,
      upload_id: uploaded.upload_id,
    });

    await createHistory(userId, report.report_id, `Created new report`);

    res.json({
      success: true,
      message: "Report generated successfully with compressed file",
      report,
      preview: finalData,
    });
  } catch (err) {
    next(err);
  }
};

/* ------------------------ تنزيل الملف المضغوط للتقرير ------------------------ */
export const downloadReportFile = async (req, res, next) => {
  try {
    const { report_id } = req.params;
    const report = await UserReport.findByPk(report_id);
    if (!report || report.is_deleted)
      return res.status(404).json({ message: "Report not found" });

    if (!report.upload_id)
      return res
        .status(404)
        .json({ message: "No file associated with this report" });

    const fileRecord = await UserUpload.findByPk(report.upload_id);
    if (!fileRecord || fileRecord.is_deleted)
      return res.status(404).json({ message: "File not found" });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileRecord.file_name.replace(/\.[^/.]+$/, "")}.zip"`
    );

    res.send(fileRecord.file_data);

    await createHistory(
      report.user_id,
      report.report_id,
      `Downloaded file: ${fileRecord.file_name}`
    );
  } catch (err) {
    next(err);
  }
};

/* ------------------------ تنزيل PDF ------------------------ */
export const downloadReportPDF = async (req, res, next) => {
  try {
    const { report_id } = req.params;
    const report = await UserReport.findByPk(report_id);
    if (!report || report.is_deleted)
      return res.status(404).json({ message: "PDF not found" });

    const filePath = report.pdf_path;
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: "PDF not found on server" });

    res.download(filePath);
  } catch (err) {
    next(err);
  }
};

/* ------------------------ عرض جميع التقارير ------------------------ */
export const getUserReports = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const reports = await UserReport.findAll({
      where: { user_id: userId, is_deleted: false },
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, reports });
  } catch (err) {
    next(err);
  }
};

/* ------------------------ عرض تقرير محدد ------------------------ */
export const getReportById = async (req, res, next) => {
  try {
    const { report_id } = req.params;
    const report = await UserReport.findOne({
      where: { report_id, is_deleted: false },
    });
    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

/* ------------------------ تحديث التقرير ------------------------ */
export const updateUserReport = async (req, res, next) => {
  try {
    const { report_id } = req.params;
    const { report_title, report_prompt } = req.body;

    const report = await UserReport.findByPk(report_id);
    if (!report || report.is_deleted)
      return res.status(404).json({ message: "Report not found" });

    if (report_title) report.report_title = report_title;
    if (report_prompt) report.report_prompt = report_prompt;

    await report.save();
    await createHistory(report.user_id, report.report_id, `Updated report`);

    res.json({ success: true, message: "Report updated successfully", report });
  } catch (err) {
    next(err);
  }
};

/* ------------------------ حذف التقرير ------------------------ */
export const deleteUserReport = async (req, res, next) => {
  try {
    const { report_id } = req.params;
    const report = await UserReport.findByPk(report_id);
    if (!report || report.is_deleted)
      return res.status(404).json({ message: "Report not found" });

    report.is_deleted = true;
    report.deleted_at = new Date();
    await report.save();
    await createHistory(report.user_id, report.report_id, `Deleted report`);

    res.json({ success: true, message: "Report deleted successfully" });
  } catch (err) {
    next(err);
  }
};
