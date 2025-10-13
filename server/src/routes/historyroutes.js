import express from "express";
import {
  getReportHistory,
  updateReportHistory,
  deleteUserReportHistory,
  createReportHistory,
  //deleteHistoryItem,
} from "../controllers/historyController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// post new history record
router.post("/", verifyToken, createReportHistory);

// get user report history
router.get("/", verifyToken, getReportHistory);

// update history rout
router.put("/:history_id", verifyToken, updateReportHistory);

//delete history rout
router.delete("/:history_id", verifyToken, deleteUserReportHistory);

export default router;

//done
