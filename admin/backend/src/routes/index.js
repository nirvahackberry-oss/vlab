import { Router } from "express";
import authRoutes from "./auth.js";
import dashboardRoutes from "./dashboard.js";
import userRoutes from "./users.js";
import roleRoutes from "./roles.js";
import courseRoutes from "./courses.js";
import semesterRoutes from "./semesters.js";
import labRoutes from "./labs.js";
import creditRoutes from "./credits.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, service: "ignito-admin-api", status: "ok" });
});

router.use("/auth", authRoutes);

router.use(authenticate, requireAdmin);

router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/courses", courseRoutes);
router.use("/semesters", semesterRoutes);
router.use("/labs", labRoutes);
router.use("/credits", creditRoutes);

export default router;
