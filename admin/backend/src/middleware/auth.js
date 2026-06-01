import { getAuthFromRequest } from "../lib/jwt.js";
import { forbidden, unauthorized } from "../lib/errors.js";

const ADMIN_ROLES = new Set(["Super Admin", "Tenant Admin"]);

export const authenticate = (req, _res, next) => {
  try {
    req.auth = getAuthFromRequest(req);
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAdmin = (req, _res, next) => {
  if (!req.auth?.userId) return next(unauthorized());
  if (!ADMIN_ROLES.has(req.auth.role)) {
    return next(forbidden("Admin access required"));
  }
  next();
};
