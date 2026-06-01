import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { signAccessToken } from "../lib/jwt.js";
import { unauthorized } from "../lib/errors.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema } from "../schemas/index.js";
import * as userService from "../services/userService.js";

const router = Router();

router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.validated;
    const user = await userService.verifyCredentials(email, password);

    if (!user) throw unauthorized("Invalid email or password");
    if (!["Super Admin", "Tenant Admin"].includes(user.role)) {
      throw unauthorized("Admin credentials required");
    }

    const token = signAccessToken(user);
    res.json({
      success: true,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      user,
    });
  }),
);

export default router;
