import User from "./userModel.js";
import TokenBlacklist from "./tokenBlacklist.js";

// تعريف العلاقات بعد تعريف الموديلات
User.hasMany(TokenBlacklist, { foreignKey: "user_id", onDelete: "CASCADE" });
TokenBlacklist.belongsTo(User, { foreignKey: "user_id" });

export { User, TokenBlacklist };