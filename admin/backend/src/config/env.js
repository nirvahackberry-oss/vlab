import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const ENV = {
  port: Number(process.env.PORT || 8090),
  apiPrefix: process.env.API_PREFIX || "/api",
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "change-me-admin-secret-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5174",
  dataFile:
    process.env.DATA_FILE ||
    path.resolve(__dirname, "../../data/platform.json"),
};
