// Check required fields for registration
export const validateRegisterInput = (req, res, next) => {
  const { full_name, email, password } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }
  next();
};

// Check required fields for login
export const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }
  next();
};

// General validation middleware for any required fields
export const validateInput = (fields = []) => (req, res, next) => {
  for (const field of fields) {
    if (!req.body[field] || req.body[field].toString().trim() === "") {
      return res.status(400).json({ success: false, message: `${field} is required.` });
    }
  }
  next();
};

// Validate file upload for report generation
export const validateReportInput = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "File is required." });
  }
  next();
};
