// src/middleware/authMiddleware.js

export const verifySession = (req, res, next) => {
  // ✅ التحقق من وجود userId في الجلسة
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized: No session found" });
  }

  // نخزن userId في req.user عشان باقي الـ routes تستخدمه
  req.user = { id: req.session.userId };
  next();
};
