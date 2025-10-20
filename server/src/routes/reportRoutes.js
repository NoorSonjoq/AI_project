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

import multer from "multer";
import path from "path";
import fs from "fs";
import UserReport from "../models/reportModel.js";
import { createHistory } from "../services/historyService.js";

const router = express.Router();

// ======================= إعداد multer للتخزين المؤقت =======================
const memoryStorage = multer.memoryStorage();
const pdfUpload = multer({ storage: memoryStorage });

// ======================= مسارات التقرير =======================

// إنشاء تقرير مع رفع الملف
router.post("/", verifyToken, upload.single("file"), generateReport);

// حفظ PDF مولد من الفرونت
router.post(
  "/save-pdf",
  verifyToken,
  pdfUpload.single("pdf"),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const file = req.file;
      if (!file)
        return res
          .status(400)
          .json({ success: false, message: "PDF file is required" });

      // حفظ PDF على السيرفر
      const pdfsDir = path.join("uploads", "reports");
      if (!fs.existsSync(pdfsDir)) fs.mkdirSync(pdfsDir, { recursive: true });

      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.originalname}`;
      const filePath = path.join(pdfsDir, fileName);

      fs.writeFileSync(filePath, file.buffer);

      // إنشاء تقرير جديد في الداتا بيس
      const report = await UserReport.create({
        user_id: userId,
        report_title: "AI Generated PDF",
        report_prompt: "Generated from frontend",
        pdf_path: filePath,
      });

      // تسجيل التاريخ (History)
      await createHistory(userId, report.report_id, "Saved PDF from frontend");

      res.json({ success: true, message: "PDF saved successfully", report });
    } catch (err) {
      next(err);
    }
  }
);

// عرض جميع التقارير
router.get("/", verifyToken, getUserReports);

// عرض تقرير محدد
router.get("/:report_id", verifyToken, getReportById);

// تحميل الملف المضغوط للتقرير
router.get("/download/:report_id", verifyToken, downloadReportFile);

// تحميل PDF التقرير
router.get("/download/pdf/:report_id", verifyToken, downloadReportPDF);

// تحديث التقرير
router.put("/:report_id", verifyToken, updateUserReport);

// حذف التقرير
router.patch("/:report_id", verifyToken, deleteUserReport);

export default router;
