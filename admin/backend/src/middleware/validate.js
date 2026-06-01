import { badRequest } from "../lib/errors.js";

export const validateBody = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join("; ");
    return next(badRequest(message));
  }
  req.validated = parsed.data;
  next();
};
