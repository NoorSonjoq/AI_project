import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const TokenBlacklist = sequelize.define(
  "TokenBlacklist",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    token: { type: DataTypes.TEXT, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "token_blacklist",
    timestamps: false,
  }
);

export default TokenBlacklist;