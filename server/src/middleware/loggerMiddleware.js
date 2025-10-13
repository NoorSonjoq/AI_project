// src/middleware/loggerMiddleware.js
import fs from "fs";
import path from "path";

// Logger Middleware: logs each request
export const logger = (req, res, next) => {
  const logMessage = `${new Date().toISOString()} | ${req.method} ${req.url}\n`;
  console.log(logMessage.trim());

  //  write to a log file
  const logFilePath = path.join("logs", "requests.log");
  if (!fs.existsSync("logs")) fs.mkdirSync("logs");
  fs.appendFileSync(logFilePath, logMessage);

  next();
};