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
    file_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_type: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    description_upload_file: {
      // ✅ تعديل الاسم ليتطابق مع الجدول MySQL
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    // ✅ من أجل الحذف المنطقي
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "user_uploads",
    timestamps: false, // لأن عندنا uploaded_at فقط
  }
);

// ✅ العلاقة مع المستخدمين
User.hasMany(UserUpload, { foreignKey: "user_id" });
UserUpload.belongsTo(User, { foreignKey: "user_id" });

export default UserUpload;
