import express from "express";
import {
  uploadFile,
  getFiles,
  downloadFile,
  deleteUserUpload,
  getFileById,
  updateUserUpload,
} from "../controllers/fileController.js";
import { verifySession } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();

// 🟢 إعداد multer لتخزين الملف في الذاكرة قبل حفظه
const upload = multer({ storage: multer.memoryStorage() });

// ✅ رفع ملف جديد (مع التحقق من الجلسة)
router.post("/upload", verifySession, upload.single("file"), uploadFile);

// ✅ جلب كل الملفات للمستخدم الحالي
router.get("/", verifySession, getFiles);

// ✅ تحميل ملف معين مباشرة من قاعدة البيانات
router.get("/download/:id", verifySession, downloadFile);

// ✅ جلب ملف حسب id
router.get("/:id", verifySession, getFileById);

// ✅ حذف ملف
router.patch("/upload/:upload_id/delete", verifySession, deleteUserUpload);

// ✅ تحديث بيانات الملف (اسم أو وصف)
router.put("/upload/:upload_id", verifySession, updateUserUpload);

export default router;
