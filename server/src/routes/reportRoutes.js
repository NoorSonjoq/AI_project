
import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { validateInput } from "../middleware/validateInputMiddleware.js";

import {
  generateReport,
  getUserReports,
  getReportById,
  downloadReportFile,
  downloadReportPDF,
  updateUserReport,
  deleteUserReport,
} from "../controllers/reportController.js";

const router = express.Router();

// إنشاء تقرير مع رفع الملف
router.post("/", verifyToken, upload.single("file"), generateReport);

// عرض جميع التقارير
router.get("/", verifyToken, getUserReports);

// عرض تقرير محدد
router.get("/:report_id", verifyToken, getReportById);

// تحميل الملف المضغوط المرتبط بالتقرير
router.get("/download/:report_id", verifyToken, downloadReportFile);

// تحميل PDF التقرير
router.get("/download/pdf/:report_id", verifyToken, downloadReportPDF);

// تحديث التقرير
router.put("/:report_id", verifyToken, updateUserReport);

// حذف التقرير
router.patch("/:report_id", verifyToken, deleteUserReport);

export default router;