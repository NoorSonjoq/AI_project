// src/routes/reportRoutes.js
import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import { verifyToken } from "../middleware/authMiddleware.js"; // لازم تكون موجودة
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

// إنشاء تقرير
router.post(
  "/",
  verifyToken,
  upload.single("file"),
  generateReport
);

// عرض كل التقارير
router.get("/", verifyToken, getUserReports);

// عرض تقرير محدد
router.get("/:report_id", verifyToken, getReportById);

// تحميل الملف الأصلي
router.get("/download/:upload_id", verifyToken, downloadReportFile);

// تحميل PDF
router.get("/download/pdf/:report_id", verifyToken, downloadReportPDF);

// تحديث التقرير
router.put("/:report_id", verifyToken, updateUserReport);

// حذف التقرير
router.patch("/:report_id", verifyToken, deleteUserReport);

export default router;
// Done test
