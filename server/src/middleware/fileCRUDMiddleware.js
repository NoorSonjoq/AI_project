// src/middleware/fileCRUDMiddleware.js
import UserUpload from "../models/uploadModel.js";

// حذف منطقي للملفات
export const deleteUserUpload = async (req, res, next) => {
  try {
    const { upload_id } = req.params;
    const upload = await UserUpload.findByPk(upload_id);

    if (!upload || upload.is_deleted)
      return res.status(404).json({ success: false, message: "Upload not found" });

    upload.is_deleted = true;
    upload.deleted_at = new Date();
    await upload.save();

    res.json({ success: true, message: "Upload deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// تحديث بيانات ملف مرفوع
export const updateUserUpload = async (req, res, next) => {
  try {
    const { upload_id } = req.params;
    const { file_name, file_path, file_type, description_upload_file } = req.body;

    const upload = await UserUpload.findByPk(upload_id);
    if (!upload || upload.is_deleted)
      return res.status(404).json({ success: false, message: "Upload not found or deleted" });

    if (file_name) upload.file_name = file_name;
    if (file_path) upload.file_path = file_path;
    if (file_type) upload.file_type = file_type;
    if (description_upload_file) upload.description_upload_file = description_upload_file;

    await upload.save();

    res.json({ success: true, message: "Upload updated successfully", upload });
  } catch (err) {
    next(err);
  }
};
