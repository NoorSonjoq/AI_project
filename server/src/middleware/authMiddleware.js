// // src/middleware/authMiddleware.js
// import jwt from "jsonwebtoken";
// import User from "../models/userModel.js";

// export const verifyToken = async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) return res.status(401).json({ message: "No token provided" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findByPk(decoded.id);
//     if (!user) return res.status(401).json({ message: "User not found" });

//     req.user = { id: user.user_id }; // نحتفظ فقط بـ user_id

//     //req.user = user; // delete this and add the line above
//     next();
//   } catch (err) {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };
// src/middleware/authMiddleware.js


import jwt from "jsonwebtoken";
import { User, TokenBlacklist } from "../models/index.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "لم يتم إرسال التوكن" });

    // التحقق من blacklist
    const blacklisted = await TokenBlacklist.findOne({ where: { token } });
    if (blacklisted) {
      return res
        .status(401)
        .json({ message: "هذا التوكن تم إلغاؤه، الرجاء تسجيل الدخول مجددًا" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id); // تأكد من أن JWT يحمل user_id أو id
    if (!user) return res.status(401).json({ message: "المستخدم غير موجود" });

    req.user = { id: user.user_id };
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ message: "انتهت صلاحية التوكن" });
    return res
      .status(401)
      .json({ message: "توكن غير صالح أو حدث خطأ أثناء التحقق" });
  }
};