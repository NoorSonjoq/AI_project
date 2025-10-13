import path from "path";

// --- Default prompt for AI reports ---
export const DEFAULT_PROMPT = "Generate a data report based on the uploaded file.";

// --- Format date as YYYY-MM-DD ---
export const formatDate = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

// --- Allowed file types for upload ---
export const allowedFileTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

export const isAllowedFileType = (mimetype) => allowedFileTypes.includes(mimetype);

// --- Generate unique file name ---
export const generateUniqueFileName = (originalName) =>
  Date.now() + "_" + originalName.replace(/\s+/g, "_");

// --- Format error message ---
export const formatError = (err) => err?.message || "Unknown error occurred";

// --- Return default value if undefined, null, or empty ---
export const defaultValue = (value, fallback) =>
  value === undefined || value === null || value === "" ? fallback : value;
