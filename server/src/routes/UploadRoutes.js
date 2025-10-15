// import express from "express";
// import {
//   uploadFile,
//   getFiles,
//   downloadFile,
//   deleteUserUpload,
//   updateUserUpload,
// } from "../controllers/fileController.js";
// import { verifyToken } from "../middleware/authMiddleware.js";
// import { upload } from "../middleware/uploadMiddleware.js";

// const router = express.Router();

// // ✅ رفع ملف جديد (مع التحقق من التوكن)
// router.post("/upload", verifyToken, upload.single("file"), uploadFile);

// // ✅ جلب كل الملفات للمستخدم الحالي
// router.get("/", verifyToken, getFiles);

// // ✅ تحميل ملف معين
// router.get("/download/:id", verifyToken, downloadFile);

// // ✅ حذف ملف (مع التوكن)
// router.patch("/upload/:upload_id/delete", verifyToken, deleteUserUpload);

// // ✅ تحديث ملف (مع التوكن)
// router.put("/upload/:upload_id", verifyToken, updateUserUpload);

// export default router;
// /// Done test


import express from "express";
import {
  uploadFile,
  getFiles,
  downloadFile,
  deleteUserUpload,
  getFileById,
  updateUserUpload,
} from "../controllers/fileController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();

// 🟢 استخدام memoryStorage لتخزين الملف في الذاكرة قبل حفظه في قاعدة البيانات
const upload = multer({ storage: multer.memoryStorage() });

// ✅ رفع ملف جديد (مع التحقق من التوكن)
router.post("/upload", verifyToken, upload.single("file"), uploadFile);

// ✅ جلب كل الملفات للمستخدم الحالي
router.get("/", verifyToken, getFiles);

// ✅ تحميل ملف معين مباشرة من قاعدة البيانات
router.get("/download/:id", verifyToken, downloadFile);

// get file by id
router.get("/:id", verifyToken, getFileById);

// ✅ حذف ملف (مع التوكن)
router.patch("/upload/:upload_id/delete", verifyToken, deleteUserUpload);

// ✅ تحديث بيانات الملف (اسم أو وصف)
router.put("/upload/:upload_id", verifyToken, updateUserUpload);

// ✅ تحميل ملف ZIP من قاعدة البيانات
router.get("/download/:id", verifyToken, downloadFile);

export default router;