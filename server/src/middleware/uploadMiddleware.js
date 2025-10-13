// src/middleware/uploadMiddleware.js
import multer from "multer";
import fs from "fs";
import path from "path";
import { generateUniqueFileName } from "../utils/helpers.js";

// --- إنشاء مجلد إذا لم يكن موجود ---
const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// --- إعداد التخزين لـ Multer ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // مجلد خاص للملفات المرفوعة من المستخدم
    const uploadDir = process.env.UPLOAD_PATH || "uploads";
    createUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateUniqueFileName(file.originalname);
    cb(null, uniqueName);
  },
});

// --- أنواع الملفات المسموح بها ---
const allowedTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

// --- فلتر للتحقق من نوع الملف ---
const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported file type"));
};

// --- تصدير Multer instance لاستخدامه في الراوتر ---
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
});
