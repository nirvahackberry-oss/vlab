import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getDashboardStats } from "../services/dashboardService.js";

const router = Router();

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    res.json({ success: true, stats: getDashboardStats() });
  }),
);

export default router;
