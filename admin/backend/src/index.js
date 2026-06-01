import express from "express";
import cors from "cors";
import { ENV } from "./config/env.js";
import { loadStore } from "./data/store.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: ENV.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.use((req, _res, next) => {
  if (ENV.nodeEnv === "development") {
    console.log(`[admin] ${req.method} ${req.url}`);
  }
  next();
});

app.use(ENV.apiPrefix, routes);

app.use(notFoundHandler);
app.use(errorHandler);

await loadStore();

app.listen(ENV.port, () => {
  console.log(`Ignito Admin API: http://localhost:${ENV.port}${ENV.apiPrefix}`);
  console.log(`Data file: ${ENV.dataFile}`);
});
