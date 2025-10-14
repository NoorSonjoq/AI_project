import UserReportHistory from "../models/historyModel.js";

export const createHistory = async (user_id, report_id = null, action_title) => {
  try {
    await UserReportHistory.create({ user_id, report_id, action_title });
  } catch (err) {
    console.error("Failed to create history:", err);
  }
};


// import fs from "fs";
// import path from "path";
// import AdmZip from "adm-zip"; // تحتاجي تثبتي المكتبة: npm install adm-zip
// import UserReportHistory from "../models/historyModel.js";

// const HISTORY_DIR = "history_files";
// if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true });

// export const createHistory = async (user_id, report_id = null, action_title) => {
//   try {
//     // 1️⃣ أنشئ بيانات السجل كـ JSON
//     const historyData = {
//       user_id,
//       report_id,
//       action_title,
//       timestamp: new Date(),
//     };
//     const fileName = `history_${Date.now()}.json`;
//     const filePath = path.join(HISTORY_DIR, fileName);

//     // 2️⃣ اكتب الملف المؤقت
//     fs.writeFileSync(filePath, JSON.stringify(historyData, null, 2));

//     // 3️⃣ اضغط الملف
//     const zip = new AdmZip();
//     zip.addLocalFile(filePath);
//     const zipPath = filePath.replace(".json", ".zip");
//     zip.writeZip(zipPath);

//     // 4️⃣ احذف الملف الأصلي لتوفير مساحة
//     fs.unlinkSync(filePath);

//     // 5️⃣ خزّن المسار في الـ database بدلاً من النص الكامل
//     await UserReportHistory.create({
//       user_id,
//       report_id,
//       action_title,
//       file_path: zipPath, // حطي عمود جديد في الـ model باسم file_path
//     });

//     console.log("History saved as zip:", zipPath);

//   } catch (err) {
//     console.error("Failed to create history:", err);
//   }
// };
