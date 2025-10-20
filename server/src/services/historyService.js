// import UserReportHistory from "../models/historyModel.js";

// export const createHistory = async (user_id, report_id = null, action_title) => {
//   try {
//     await UserReportHistory.create({ user_id, report_id, action_title });
//   } catch (err) {
//     console.error("Failed to create history:", err);
//   }
// };


import UserReportHistory from "../models/historyModel.js";

export const createHistory = async (user_id, report_id = null, action_title) => {
  try {
    const history = await UserReportHistory.create({ user_id, report_id, action_title });
    console.log("History saved:", history.history_id || history.id);
    return history; // ارجاع التاريخ للتاكد
  } catch (err) {
    console.error("Failed to create history:", err);
    throw err; // رفع الخطأ ليتعرف عليه الكود الرئيسي
  }
};
