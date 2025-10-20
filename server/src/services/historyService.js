import UserReportHistory from "../models/historyModel.js";

export const createHistory = async (user_id, report_id = null, action_title) => {
  try {
    await UserReportHistory.create({ user_id, report_id, action_title });
  } catch (err) {
    console.error("Failed to create history:", err);
  }
};
