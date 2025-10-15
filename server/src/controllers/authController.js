import sequelize from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// --- Gemini config ---
const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- REGISTER ---
export const register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const existingUser = await sequelize.query(
      "SELECT * FROM users WHERE email = ?",
      { replacements: [email], type: sequelize.QueryTypes.SELECT }
    );

    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await sequelize.query(
      "INSERT INTO users (full_name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      { replacements: [full_name, email, hashedPassword] }
    );

    // استخراج user_id الجديد
    const userId = result[0]; 

    res
      .status(201)
      .json({
        success: true,
        message: "User registered successfully",
        user_id: userId,
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- LOGIN ---
export const login = async (req, res) => {
  try {
    console.log("Login request body:", req.body);
    const { email, password } = req.body;

    // التحقق من المستخدم مع logical delete
    const users = await sequelize.query(
      "SELECT * FROM users WHERE email = ? AND (is_deleted IS NULL OR is_deleted = 0)",
      { replacements: [email], type: sequelize.QueryTypes.SELECT }
    );

    const user = users[0];
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });

    // 👈 Session-based: تخزين user_id داخل الجلسة
    req.session.userId = user.user_id;

    res.status(200).json({ 
      success: true, 
      message: "Login successful" 
      // ❌ لا حاجة لإرسال token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


//LOGICAL DELETE USER 
export const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [result] = await sequelize.query(
      "UPDATE users SET is_deleted = 1, deleted_at = NOW() WHERE user_id = ?",
      { replacements: [user_id] }
    );

    // ✅ التحقق من وجود المستخدم
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// --- UPDATE USER ---
export const updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { full_name, email, password } = req.body;

    const users = await sequelize.query(
      "SELECT * FROM users WHERE user_id = ? AND (is_deleted IS NULL OR is_deleted = 0)",
      { replacements: [user_id], type: sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    let query = "UPDATE users SET full_name = ?, email = ?, updated_at = NOW()";
    const replacements = [full_name, email];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ", password_hash = ?";
      replacements.push(hashedPassword);
    }

    query += " WHERE user_id = ?";
    replacements.push(user_id);

    await sequelize.query(query, { replacements });

    res
      .status(200)
      .json({ success: true, message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- Gemini AI integration ---
export const generateAIReport = async (prompt, dataPreview) => {
  if (!GEMINI_API_KEY) return "AI summary unavailable (no API key)";

  try {
    const response = await axios.post(
      GEMINI_API_URL,
      { prompt, dataPreview },
      { headers: { Authorization: `Bearer ${GEMINI_API_KEY}` } }
    );

    return response.data.result || "No result from AI";
  } catch (err) {
    console.error("Gemini API error:", err.message);
    return "AI summary unavailable (error)";
  }
};
