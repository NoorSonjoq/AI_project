// src/services/geminiService.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_BASE = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";

// تقطع معاينة البيانات علشان ما نجاوز حدود التوكن/الـ payload
const truncatePreview = (data, maxChars = 3500) => {
  const s = typeof data === "string" ? data : JSON.stringify(data);
  return s.length > maxChars ? s.slice(0, maxChars) + "... [truncated]" : s;
};

// نحاول نستخرج النص من أشكال ردّ مختلفة (مرونة)
const extractTextFromResponse = (respData) => {
  if (!respData) return null;

  // بعض الصيغ: resp.data.candidates[0].content.parts[0].text
  if (Array.isArray(respData.candidates) && respData.candidates[0]) {
    const c = respData.candidates[0];
    if (Array.isArray(c.content) && c.content[0]?.parts?.[0]?.text) {
      return c.content[0].parts[0].text;
    }
    if (c.content?.parts?.[0]?.text) return c.content.parts[0].text;
  }

  // بعض صيغ أخرى
  if (Array.isArray(respData.output) && respData.output[0]?.content?.[0]?.text) {
    return respData.output[0].content[0].text;
  }

  if (respData.text) return respData.text;
  return null;
};

export const generateAIReport = async (prompt, dataPreview, options = {}) => {
  if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY in .env");

  // نحضر النص المرسل للـ model
  const preview = truncatePreview(dataPreview, options.maxPreviewChars || 3500);
  const fullPrompt = `${prompt}\n\nData preview (first rows):\n${preview}\n\nPlease return:\n1) short summary\n2) top findings (bullet points)\n3) suggested next actions.`;

  const url = `${GEMINI_BASE}/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const resp = await axios.post(
      url,
      {
        // هذا شكل body متوافق مع أمثلة REST (contents -> parts -> text). :contentReference[oaicite:2]{index=2}
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
        // لو بدك تضبطي إعدادات إضافية جرب تضيف config / safetySettings هنا
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: options.timeoutMs || 120000,
      }
    );

    const text = extractTextFromResponse(resp.data) || "No text returned from Gemini.";
    return text;
  } catch (err) {
    console.error("Gemini API error:", err.response?.data || err.message);
    // رجّع رسالة مفيدة للكنترولر
    throw new Error(err.response?.data?.error?.message || err.message || "Gemini request failed");
  }
};
