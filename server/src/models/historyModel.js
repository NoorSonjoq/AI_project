import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./userModel.js";
import UserReport from "./reportModel.js";

const UserReportHistory = sequelize.define(
  "UserReportHistory",
  {
    history_id: {
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
    report_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: UserReport,
        key: "report_id",
      },
      onDelete: "SET NULL",
    },
    action_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    
    file_path: {
  type: DataTypes.STRING,
  allowNull: false,
  },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    // added this
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
    tableName: "user_reports_histories",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// the relationships
User.hasMany(UserReportHistory, { foreignKey: "user_id" });
UserReportHistory.belongsTo(User, { foreignKey: "user_id" });

UserReport.hasMany(UserReportHistory, { foreignKey: "report_id" });
UserReportHistory.belongsTo(UserReport, { foreignKey: "report_id" });

export default UserReportHistory;
