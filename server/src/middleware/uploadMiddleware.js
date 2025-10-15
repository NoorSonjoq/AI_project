// src/middleware/uploadMiddleware.js
import multer from "multer";

/* ----------------------------------------------------------------
   ⚙️ إعداد التخزين في الذاكرة (بدل الحفظ على القرص)
   لأننا نحفظ الملف مباشرة داخل قاعدة البيانات
------------------------------------------------------------------ */
const storage = multer.memoryStorage();

/* ----------------------------------------------------------------
   📂 أنواع الملفات المسموح بها فقط (CSV و Excel)
------------------------------------------------------------------ */
const allowedTypes = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

/* ----------------------------------------------------------------
   🔍 فلتر التحقق من نوع الملف قبل رفعه
------------------------------------------------------------------ */
const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("❌ نوع الملف غير مدعوم. فقط ملفات CSV أو Excel مسموح بها.")
    );
  }
};

/* ----------------------------------------------------------------
   🚀 إنشاء Multer instance مع تحديد الحجم الأقصى
------------------------------------------------------------------ */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB كحد افتراضي
  },
});
