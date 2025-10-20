// export default UserReport;
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./userModel.js";
import UserUpload from "./uploadModel.js"; // استدعاء نموذج UserUpload

const UserReport = sequelize.define(
  "UserReport",
  {
    report_id: {
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
    report_title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "Untitled Report",
    },
    report_prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    pdf_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
    },
    upload_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: UserUpload,
        key: "upload_id",
      },
      onDelete: "SET NULL",
    },
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
    tableName: "user_reports",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// العلاقات
User.hasMany(UserReport, { foreignKey: "user_id" });
UserReport.belongsTo(User, { foreignKey: "user_id" });

// ربط التقرير بالملف المضغوط
UserUpload.hasMany(UserReport, { foreignKey: "upload_id" });
UserReport.belongsTo(UserUpload, { foreignKey: "upload_id" });

export default UserReport;