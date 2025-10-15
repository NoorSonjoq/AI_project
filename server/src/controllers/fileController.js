import XLSX from "xlsx";
import csv from "csv-parser";
import stream from "stream";
import JSZip from "jszip";
import { generateAIReport } from "../services/geminiService.js";
import UserUpload from "../models/uploadModel.js";
import { createHistory } from "../services/historyService.js";

/* ----------------------------------------------------------------
   🧠 قراءة معاينة من الملف لإرساله إلى Gemini
------------------------------------------------------------------ */
const readFilePreview = async (fileBuffer, mimeType, maxRows = 15) => {
  if (mimeType.includes("csv")) {
    return new Promise((resolve, reject) => {
      const rows = [];
      const readable = new stream.Readable();
      readable._read = () => {};
      readable.push(fileBuffer);
      readable.push(null);

      readable
        .pipe(csv())
        .on("data", (data) => {
          if (rows.length < maxRows) rows.push(data);
        })
        .on("end", () => resolve(rows))
        .on("error", reject);
    });
  } else if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    return data.slice(0, maxRows);
  } else {
    const text = fileBuffer.toString("utf8");
    return text.slice(0, 2000);
  }
};

/* ----------------------------------------------------------------
   📤 رفع ملف جديد وضغطه ثم حفظه في قاعدة البيانات
------------------------------------------------------------------ */
export const uploadFile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "غير مصرح: المستخدم غير موجود في التوكن",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "لم يتم رفع أي ملف",
      });
    }

    // ✅ السماح فقط بملفات CSV وExcel
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "❌ نوع الملف غير مدعوم. فقط CSV أو Excel مسموح.",
      });
    }

    const fileBuffer = req.file.buffer;

    // 🧠 قراءة المعاينة للتحليل
    const previewData = await readFilePreview(fileBuffer, req.file.mimetype);
    const aiText = await generateAIReport(
      "Analyze the uploaded dataset and summarize key insights:",
      previewData
    );

    // 📦 ضغط الملف قبل التخزين
    const zip = new JSZip();
    zip.file(req.file.originalname, fileBuffer);
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // 🗃 حفظ الملف المضغوط في قاعدة البيانات
    const uploaded = await UserUpload.create({
      user_id: req.user.id,
      file_name: req.file.originalname,
      file_type: "application/zip",
      file_data: zipBuffer,
    });

    await createHistory(
      req.user.id,
      uploaded.upload_id,
      `Uploaded ${uploaded.file_name}`
    );

    return res.status(201).json({
      success: true,
      message: "✅ تم رفع الملف وضغطه وتحليله بنجاح",
      file: {
        upload_id: uploaded.upload_id,
        file_name: uploaded.file_name,
        file_type: uploaded.file_type,
        uploaded_at: uploaded.uploaded_at,
      },
      aiResponse: aiText,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Upload failed" });
  }
};

/* ----------------------------------------------------------------
   📋 جلب جميع الملفات (بدون محتوى)
------------------------------------------------------------------ */
export const getFiles = async (req, res, next) => {
  try {
    const files = await UserUpload.findAll({
      where: { user_id: req.user.id, is_deleted: false },
      attributes: ["upload_id", "file_name", "file_type", "uploaded_at"],
      order: [["uploaded_at", "DESC"]],
    });
    res.json({ success: true, files });
  } catch (err) {
    next(err);
  }
};

/* ----------------------------------------------------------------
   📂 جلب ملف واحد (فك الضغط وإرجاع المحتوى الأصلي)
------------------------------------------------------------------ */
export const getFileById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await UserUpload.findOne({
      where: { upload_id: id, user_id: req.user.id, is_deleted: false },
    });

    if (!file)
      return res
        .status(404)
        .json({ success: false, message: "الملف غير موجود" });

    // فك الضغط
    const zip = await JSZip.loadAsync(file.file_data);
    const firstFileName = Object.keys(zip.files)[0];
    const extractedBuffer = await zip.files[firstFileName].async("nodebuffer");

    // قراءة المحتوى الأصلي
    let fileContent;
    if (firstFileName.endsWith(".csv")) {
      fileContent = extractedBuffer.toString("utf8");
    } else if (
      firstFileName.endsWith(".xls") ||
      firstFileName.endsWith(".xlsx")
    ) {
      const workbook = XLSX.read(extractedBuffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      fileContent = XLSX.utils.sheet_to_json(sheet);
    } else {
      fileContent = extractedBuffer.toString("utf8");
    }

    await createHistory(req.user.id, file.upload_id, `Viewed ${file.file_name}`);

    res.json({
      success: true,
      file: {
        upload_id: file.upload_id,
        file_name: firstFileName,
        uploaded_at: file.uploaded_at,
        content: fileContent,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ----------------------------------------------------------------
   ❌ حذف ملف (soft delete)
------------------------------------------------------------------ */
export const deleteUserUpload = async (req, res, next) => {
  try {
    const upload = await UserUpload.findByPk(req.params.upload_id);

    if (!upload || upload.is_deleted) {
      return res
        .status(404)
        .json({ success: false, message: "الملف غير موجود أو محذوف" });
    }

    upload.is_deleted = true;
    upload.deleted_at = new Date();
    await upload.save();

    await createHistory(
      req.user.id,
      null,
      `Deleted file: ${upload.file_name}`
    );

    res.json({ success: true, message: "تم حذف الملف بنجاح" });
  } catch (err) {
    next(err);
  }
};

/* ----------------------------------------------------------------
   ✏ تحديث معلومات ملف
------------------------------------------------------------------ */
export const updateUserUpload = async (req, res, next) => {
  try {
    const { file_name, description_upload_file } = req.body;
    const upload = await UserUpload.findByPk(req.params.upload_id);

    if (!upload || upload.is_deleted) {
      return res
        .status(404)
        .json({ success: false, message: "الملف غير موجود" });
    }

    if (file_name) upload.file_name = file_name;
    if (description_upload_file)
      upload.description_upload_file = description_upload_file;

    await upload.save();
    await createHistory(req.user.id, null, "Updated a file");

    res.json({ success: true, message: "تم تحديث الملف بنجاح", upload });
  } catch (err) {
    next(err);
  }
};

/* ----------------------------------------------------------------
   ⬇ تحميل ملف ZIP من قاعدة البيانات كما هو
------------------------------------------------------------------ */
export const downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await UserUpload.findOne({
      where: { upload_id: id, user_id: req.user.id, is_deleted: false },
    });

    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "❌ الملف غير موجود أو تم حذفه." });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.file_name.replace(/\.[^/.]+$/, "")}.zip"`
    );

    res.send(file.file_data);

    await createHistory(req.user.id, file.upload_id, `Downloaded ${file.file_name}`);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "فشل في تحميل الملف.",
    });
  }
};
