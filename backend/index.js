import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { ENV } from "./config/env.js";
import { ROUTES } from "./router.js";
import { expressRoute } from "./lib/apigw.js";
import { setupTerminal } from "./terminalHandler.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  },
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

for (const route of ROUTES) {
  expressRoute(app, route, ENV.apiPrefix);
}

setupTerminal(io);

httpServer.listen(ENV.port, () => {
  console.log(`VLab API server: http://localhost:${ENV.port}${ENV.apiPrefix}`);
  console.log(`Storage: ${ENV.sessionsTable ? `DynamoDB (${ENV.sessionsTable})` : "in-memory"}`);
  console.log(`ECS: ${ENV.ecsCluster || "disabled (mock sessions)"}`);
  console.log(`Container access: ${ENV.containerHostMode} (8080=IDE, 8888=Jupyter)`);
});
