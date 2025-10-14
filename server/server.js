import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import authRoutes from "./src/routes/authRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import fileRoutes from "./src/routes/UploadRoutes.js";
import historyRoutes from "./src/routes/historyroutes.js";
import { logger } from "./src/middleware/loggerMiddleware.js";
import { errorHandler } from "./src/middleware/errorMiddleware.js";
import { connectDB } from "./src/config/db.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ إعدادات CORS للسماح لـ Vercel و Localhost
const allowedOrigins = [
  "https://ai-project-3x1h.vercel.app",
  "https://newre-git-main-noorsonjoq-s-projects.vercel.app",
  "http://localhost:3000"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // السماح للـ Postman أو server-to-server
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error("CORS policy does not allow access from this origin."), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ✅ إنشاء uploads folder إذا غير موجود
const uploadsDir = path.join(__dirname, process.env.UPLOAD_PATH || "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ✅ Static folder للملفات المرفوعة
app.use("/uploads", express.static(uploadsDir));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/history", historyRoutes);

// ✅ Test route
app.get("/", (req, res) => res.send("🚀 API is running successfully..."));

// Catch-all route للـ React frontend
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
});


// ✅ Error handling (آخر شيء)
app.use(errorHandler);

// ✅ Connect to DB
connectDB()
  .then(() => console.log("✅ Database ready"))
  .catch((err) => console.error("❌ Database connection failed:", err));

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
