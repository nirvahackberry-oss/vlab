import { ok } from "../lib/apigw.js";
import { forbidden, notFound } from "../lib/errors.js";
import { getSession } from "../services/sessionRepository.js";
import { getLabRuntime, getContainerHost } from "../lib/labTools.js";

export const jupyterHealthHandler = async ({ pathParameters, auth }) => {
  const sessionId = pathParameters?.sessionId;
  const session = await getSession(sessionId);
  if (!session) throw notFound("Session not found");
  if (session.userId !== auth.userId && auth.role !== "Super Admin") {
    throw forbidden("You do not own this session");
  }

  const host = getContainerHost(session);
  const port = getLabRuntime(session.labId).port || 8080;
  if (!host || session.status !== "running") {
    return ok({
      ready: false,
      message: "Jupyter container is not ready yet",
      host: host || null,
      port,
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const probe = await fetch(`http://${host}:${port}/api`, { signal: controller.signal });
    clearTimeout(timer);
    return ok({
      ready: probe.ok,
      status: probe.status,
      host,
      port,
    });
  } catch (err) {
    clearTimeout(timer);
    return ok({
      ready: false,
      message:
        "Cannot reach Jupyter on port 8080. AWS engineer must allow inbound TCP 8080 on the ECS security group.",
      host,
      port,
      error: err.message,
    });
  }
};
