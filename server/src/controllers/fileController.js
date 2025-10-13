import path from "path";
import fs from "fs";
import XLSX from "xlsx";
import csv from "csv-parser";
import { generateAIReport } from "../services/geminiService.js";
import UserUpload from "../models/uploadModel.js";
import { createHistory } from "../services/historyService.js";

// Upload directory
const UPLOAD_DIR = "uploads";

// تحويل أول جزء من الملف لنص مختصر (عشان نرسله لـ Gemini)
const readFilePreview = async (filePath, mimeType, maxRows = 15) => {
  if (mimeType.includes("csv")) {
    return new Promise((resolve, reject) => {
      const rows = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => {
          if (rows.length < maxRows) rows.push(data);
        })
        .on("end", () => resolve(rows))
        .on("error", reject);
    });
  } else if (
    mimeType.includes("excel") ||
    filePath.endsWith(".xlsx") ||
    filePath.endsWith(".xls")
  ) {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    return data.slice(0, maxRows);
  } else {
    const text = fs.readFileSync(filePath, "utf8");
    return text.slice(0, 2000); // لو الملف نصي
  }
};

// 📤 رفع ملف وتشغيل Gemini عليه
export const uploadFile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found in token",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const filePath = req.file.path.replace(/\\/g, "/");

    // 🧠 نقرأ معاينة من الملف لإرسالها إلى Gemini
    const previewData = await readFilePreview(filePath, req.file.mimetype);

    // 🧠 نرسل الطلب إلى Gemini API
    const aiText = await generateAIReport(
      "Analyze the uploaded hospital dataset and summarize key insights:",
      previewData
    );

    // 🗃️ نحفظ الملف في قاعدة البيانات
    const uploaded = await UserUpload.create({
      user_id: req.user.id,
      file_name: req.file.filename,
      file_path: filePath,
      file_type: req.file.mimetype,
      description_upload_file: "AI analyzed file",
    });

    // 🧾 نسجل العملية في history
    await createHistory(req.user.id, uploaded.upload_id, `Uploaded ${uploaded.file_name}`);

    // ✅ نرجع الرد الكامل للفرونت
    return res.status(201).json({
      success: true,
      message: "File uploaded and analyzed successfully",
      file: uploaded,
      aiResponse: aiText,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
};


export const getFiles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const files = await UserUpload.findAll({
      where: { user_id: userId, is_deleted: false },
      order: [["uploaded_at", "DESC"]],
    });
    res.json({ success: true, files });
  } catch (err) {
    next(err);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const file = await UserUpload.findOne({
      where: { upload_id: id, user_id: userId, is_deleted: false },
    });
    if (!file)
      return res.status(404).json({ success: false, message: "File not found." });

    const filePath = path.resolve(file.file_path);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ success: false, message: "File not found on disk." });

    res.download(filePath, file.file_name);
  } catch (err) {
    next(err);
  }
};

export const deleteUserUpload = async (req, res, next) => {
  try {
    const { upload_id } = req.params;

    const upload = await UserUpload.findByPk(upload_id);
    if (!upload || upload.is_deleted) {
      return res.status(404).json({
        success: false,
        message: "Upload not found or already deleted",
      });
    }

    upload.is_deleted = true;
    upload.deleted_at = new Date();
    await upload.save();

    await createHistory(req.user.id, null, `Deleted file: ${upload.file_name}`);
    res.json({ success: true, message: "Upload deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const updateUserUpload = async (req, res, next) => {
  try {
    const { upload_id } = req.params;
    const { file_name, description_upload_file } = req.body;

    const upload = await UserUpload.findByPk(upload_id);
    if (!upload || upload.is_deleted)
      return res.status(404).json({ success: false, message: "Upload not found or deleted" });

    if (file_name) upload.file_name = file_name;
    if (description_upload_file)
      upload.description_upload_file = description_upload_file;

    await upload.save();
    await createHistory(req.user.id, null, "Updated a file");

    res.json({ success: true, message: "Upload updated successfully", upload });
  } catch (err) {
    next(err);
  }
};
