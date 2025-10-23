import UserReportHistory from "../models/historyModel.js";
import { createHistory } from "../services/historyService.js";

// create Repor tHistory
export const createReportHistory = async (req, res, next) => {
  try {
    const { report_id, action_title } = req.body;
    const user_id = req.user.id;

    if (!action_title) return res.status(400).json({ success: false, message: "Action title is required" });

    const history = await UserReportHistory.create({ user_id, report_id: report_id || null, action_title });

    res.status(201).json({ success: true, message: "Report history created successfully", history });
  } catch (err) {
    next(err);
  }
};

// Get report history
export const getReportHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await UserReportHistory.findAll({
      where: { user_id: userId, is_deleted: false },
      order: [["created_at", "DESC"]],
    });

    res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
};

// Update history
export const updateReportHistory = async (req, res, next) => {
  try {
    const { history_id } = req.params;
    const { action_title } = req.body;

    const history = await UserReportHistory.findByPk(history_id);
    if (!history || history.is_deleted)
      return res
        .status(404)
        .json({ success: false, message: "History item not found" });

    if (action_title) history.action_title = action_title;
    await history.save();

    res.json({
      success: true,
      message: "History item updated successfully",
      history,
    });
  } catch (err) {
    next(err);
  }
};

// Logical delete history
export const deleteUserReportHistory = async (req, res, next) => {
  try {
    const { history_id } = req.params;
    const history = await UserReportHistory.findByPk(history_id);

    if (!history || history.is_deleted)
      return res
        .status(404)
        .json({ success: false, message: "History item not found" });

    history.is_deleted = true;
    history.deleted_at = new Date();
    await history.save();

    res.json({ success: true, message: "History item deleted successfully" });
  } catch (err) {
    next(err);
  }
};