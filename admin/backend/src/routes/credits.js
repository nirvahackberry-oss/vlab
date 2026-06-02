import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getStore } from "../data/store.js";

const router = Router();

router.get(
  "/transactions",
  asyncHandler(async (req, res) => {
    const { creditTransactions } = getStore();
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const userId = req.query.userId;

    let transactions = creditTransactions;
    if (userId) {
      transactions = transactions.filter((t) => t.userId === userId);
    }

    res.json({
      success: true,
      transactions: transactions.slice(0, limit),
    });
  }),
);

export default router;
