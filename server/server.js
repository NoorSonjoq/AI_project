import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Op } from "sequelize";

import authRoutes from "./src/routes/authRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import fileRoutes from "./src/routes/UploadRoutes.js";
import historyRoutes from "./src/routes/historyroutes.js";
import { logger } from "./src/middleware/loggerMiddleware.js";
import { errorHandler } from "./src/middleware/errorMiddleware.js";
import { connectDB } from "./src/config/db.js";
import TokenBlacklist from "./src/models/tokenBlacklist.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ إعداد CORS المضمون والآمن
app.use(
  cors({
    origin: [
      "https://ai-project-3x1h.vercel.app", // موقعك على Vercel
      "https://newre-git-main-noorsonjoq-s-projects.vercel.app", // رابط إضافي إذا استخدمتيه
      "http://localhost:3000", // للسماح بالتجربة محلياً
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ✅ إنشاء مجلد للملفات المرفوعة إن لم يكن موجودًا
const uploadsDir = path.join(__dirname, process.env.UPLOAD_PATH || "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// ✅ مجلد ثابت لعرض الملفات
app.use("/uploads", express.static(uploadsDir));

// ✅ المسارات
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/history", historyRoutes);

// ✅ معالج الأخطاء
app.use(errorHandler);

// ✅ الاتصال بقاعدة البيانات
connectDB()
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => console.error("❌ Database connection failed:", err));

// ✅ Route تجريبي للتأكد أن السيرفر شغال
app.get("/", (req, res) => {
  res.send("🚀 API is running successfully...");
});

// ✅ تنظيف التوكنات المنتهية الصلاحية
const cleanupExpiredTokens = async () => {
  try {
    const deleted = await TokenBlacklist.destroy({
      where: { expires_at: { [Op.lt]: new Date() } },
    });
    if (deleted > 0) console.log(`🗑 ${deleted} توكنات منتهية الصلاحية`);
  } catch (err) {
    console.error("Error cleaning up expired tokens:", err);
  }
};

cleanupExpiredTokens();
setInterval(cleanupExpiredTokens, 60 * 60 * 1000); // كل ساعة

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
