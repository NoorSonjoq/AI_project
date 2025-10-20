// src/controllers/reportController.js
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import XLSX from "xlsx";
import PDFDocument from "pdfkit";
import axios from "axios";
import dotenv from "dotenv";

import UserReport from "../models/reportModel.js";
import UserUpload from "../models/uploadModel.js";
import { DEFAULT_PROMPT, generateUniqueFileName } from "../utils/helpers.js";
import { createHistory } from "../services/historyService.js";

dotenv.config();

// --- Gemini AI config ---
const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- Parse CSV/XLSX file ---
const parseFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return new Promise((resolve, reject) => {
    if (ext === ".csv") {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (err) => reject(err));
    } else if (ext === ".xlsx" || ext === ".xls") {
      try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        resolve(XLSX.utils.sheet_to_json(worksheet));
      } catch (err) {
        reject(err);
      }
    } else reject(new Error("Unsupported file type"));
  });
};

// --- Create PDF from data ---
const createPDF = (data, title, description, outputFilePath) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const writeStream = fs.createWriteStream(outputFilePath);
    doc.pipe(writeStream);

    doc.fontSize(16).text(title, { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(description, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, {
      align: "center",
    });
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

// --- Generate AI Summary using Gemini ---
const generateAIReport = async (prompt, dataPreview) => {
  if (!GEMINI_API_KEY) return "AI summary unavailable (no API key)";

  try {
    const response = await axios.post(
      GEMINI_API_URL,
      { prompt, dataPreview },
      { headers: { Authorization: `Bearer ${GEMINI_API_KEY}` } }
    );

    return response.data.result || "No result from AI";
  } catch (err) {
    console.error("Gemini API error:", err.message);
    return "AI summary unavailable (error)";
  }
};

// --- Generate Report ---
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

    // 1️⃣ مسار الملف المرفوع
    const filePath = path.join("uploads", file.filename);

    // 2️⃣ قراءة البيانات من CSV أو XLSX
    const parsedData = await parseFile(filePath);

    // 3️⃣ توليد ملخص AI
    const aiSummary = await generateAIReport(prompt, parsedData);
    const finalData = [...parsedData, { AI_Summary: aiSummary }];


    // 4️⃣ إعداد معلومات التقرير
    const reportTitle = "AI Generated Report";
    const reportDescription = `Report based on prompt: ${prompt}`;
    const pdfFileName = generateUniqueFileName("report.pdf");

        // Folder for reports
    
    // 5️⃣ إنشاء مجلد للتقارير إذا لم يكن موجود
    const reportsDir = path.join("uploads", "reports");
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const pdfFilePath = path.join(reportsDir, pdfFileName);

    // 6️⃣ إنشاء PDF
    await createPDF(finalData, reportTitle, reportDescription, pdfFilePath);

    // 7️⃣ قراءة محتوى PDF كـ buffer
    const pdfBuffer = fs.readFileSync(pdfFilePath);

    // 8️⃣ حفظ التقرير في قاعدة البيانات
    const report = await UserReport.create({
      user_id: userId,
      report_title: reportTitle,
      report_prompt: reportDescription,
      pdf_path: pdfFilePath,  // للاستخدام في التحميل من السيرفر
      pdf_data: pdfBuffer,    // يخزن المحتوى داخل قاعدة البيانات
    });

    // 9️⃣ تسجيل التاريخ
    await createHistory(userId, report.report_id, "Created new report");

    //  🔟 إرسال الرد
    res.json({
      success: true,
      message: "Report generated successfully",
      report,
      preview: finalData,
    });
  } catch (err) {
    next(err);
  }
};
// --- Get All Reports ---
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

// --- Get Report by ID ---
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

// --- Update Report ---
export const updateUserReport = async (req, res, next) => {
  try {
    const { report_id } = req.params;
    const { report_title, report_prompt, pdf_path } = req.body;

    const report = await UserReport.findByPk(report_id);
    if (!report || report.is_deleted)
      return res.status(404).json({ message: "Report not found" });

    if (report_title) report.report_title = report_title;
    if (report_prompt) report.report_prompt = report_prompt;
    if (pdf_path) report.pdf_path = pdf_path;

    await report.save();
    await createHistory(report.user_id, report.report_id, "Updated report");

    res.json({ success: true, message: "Report updated successfully", report });
  } catch (err) {
    next(err);
  }
};

// --- Delete Report (Logical) ---
export const deleteUserReport = async (req, res, next) => {
  try {
    const { report_id } = req.params;
    const report = await UserReport.findByPk(report_id);
    if (!report || report.is_deleted)
      return res.status(404).json({ message: "Report not found" });

    report.is_deleted = true;
    report.deleted_at = new Date();
    await report.save();
    await createHistory(report.user_id, report.report_id, "Deleted report");

    res.json({ success: true, message: "Report deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// --- Download Original Uploaded File ---
export const downloadReportFile = async (req, res, next) => {
  try {
    const { upload_id } = req.params;
    const fileRecord = await UserUpload.findByPk(upload_id);
    if (!fileRecord || fileRecord.is_deleted)
      return res.status(404).json({ message: "File not found" });

    const filePath = fileRecord.file_path;
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: "File not found on server" });

    res.download(filePath);
  } catch (err) {
    next(err);
  }
};

// --- Download PDF ---
export const downloadReportPDF = async (req, res, next) => {
  try {
    const { report_id } = req.params;
    const report = await UserReport.findByPk(report_id);
    if (!report || report.is_deleted)
      return res.status(404).json({ message: "PDF not found" });

    if (report.pdf_data) {
      // التحميل مباشرة من قاعدة البيانات
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="report_${report_id}.pdf"`
      );
      return res.send(report.pdf_data);
    }

    // fallback: لو الملف موجود على السيرفر
    const filePath = report.pdf_path;
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: "PDF not found on server" });

    res.download(filePath);
  } catch (err) {
    next(err);
  }
};

