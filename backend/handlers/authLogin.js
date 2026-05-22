import { ok } from "../lib/apigw.js";
import { signAccessToken } from "../lib/jwt.js";
import { badRequest, unauthorized } from "../lib/errors.js";

const USERS = [
  {
    id: "user-admin-001",
    email: "admin@ignito.com",
    password: "admin123",
    name: "Meet Nayak",
    role: "Super Admin",
  },
  {
    id: "user-002",
    email: "meet.nayak@hackberrysoftech.in",
    password: "admin123",
    name: "Meet Nayak",
    role: "Tenant Admin",
  },
];

export const authLoginHandler = async ({ body }) => {
  const { email, password } = body || {};
  if (!email || !password) throw badRequest("email and password are required");

  const user = USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user) throw unauthorized("Invalid email or password");

  const token = signAccessToken(user);
  return ok({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });
};
