import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./userModel.js";

const UserUpload = sequelize.define(
  "UserUpload",
  {
    upload_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
      onDelete: "CASCADE",
    },

    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    // ✅ نحذف file_path لأنه لم يعد مستخدمًا
    // ونضيف file_data لتخزين محتوى الملف (كمضغوط ZIP)
    file_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    file_data: {
      type: DataTypes.BLOB("long"),
      allowNull: false, // لأننا نحفظ الملف فعليًا هنا
    },

    description_upload_file: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "user_uploads",
    timestamps: false, // لأننا نستخدم uploaded_at فقط
  }
);

// ✅ العلاقة مع المستخدمين
User.hasMany(UserUpload, { foreignKey: "user_id", onDelete: "CASCADE" });
UserUpload.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });

export default UserUpload;