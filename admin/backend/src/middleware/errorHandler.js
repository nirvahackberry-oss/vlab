import { AppError } from "../lib/errors.js";

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : "INTERNAL_ERROR";

  if (statusCode >= 500) {
    console.error("[admin-api]", err);
  }

  res.status(statusCode).json({
    success: false,
    code,
    message: err.message || "Internal server error",
  });
};

export const notFoundHandler = (_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
};
