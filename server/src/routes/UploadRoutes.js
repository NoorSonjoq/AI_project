import express from "express";
import {
  uploadFile,
  getFiles,
  downloadFile,
  getFileById,
  deleteUserUpload,
  updateUserUpload,
} from "../controllers/fileController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();

// 🟢 تخزين الملف في الذاكرة قبل حفظه في قاعدة البيانات
const upload = multer({ storage: multer.memoryStorage() });

// ✅ رفع ملف جديد
router.post("/upload", verifyToken, upload.single("file"), uploadFile);

// ✅ جلب كل الملفات للمستخدم الحالي
router.get("/", verifyToken, getFiles);

// ✅ جلب بيانات ملف واحد بدون تنزيل
router.get("/:id", verifyToken, getFileById);

// ✅ تنزيل الملف من قاعدة البيانات
router.get("/download/:id", verifyToken, downloadFile);

// ✅ حذف ملف
router.patch("/upload/:upload_id/delete", verifyToken, deleteUserUpload);

// ✅ تحديث بيانات الملف (اسم أو وصف)
router.put("/upload/:upload_id", verifyToken, updateUserUpload);

export default router;
