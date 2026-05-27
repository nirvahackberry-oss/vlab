import { getSessionApiBaseUrl } from "../lib/labTools.js";
import { resolveLabType } from "../lib/labTypeMapper.js";

const CONTAINER_TIMEOUT_MS = 35000;

const containerFetch = async (url, options = {}) => {
  const timeout = options.timeout || CONTAINER_TIMEOUT_MS;
  const { timeout: _, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...fetchOptions, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const buildHeaders = (session) => {
  const headers = { "Content-Type": "application/json" };
  if (session?.sessionToken) {
    headers["X-Session-Token"] = session.sessionToken;
  }
  return headers;
};

export const saveToContainer = async (session, { path, content }) => {
  const baseUrl = getSessionApiBaseUrl(session);
  if (!baseUrl) return { proxied: false };

  // Fast reachability check (1.2s) to avoid 35s connection timeouts in local dev
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1200);
  try {
    await fetch(baseUrl, { method: "HEAD", signal: controller.signal });
  } catch (err) {
    console.warn("[saveToContainer] Container unreachable, skipping proxy:", err.message);
    return { proxied: false };
  } finally {
    clearTimeout(timer);
  }

  const response = await containerFetch(`${baseUrl}/api/save`, {
    method: "POST",
    headers: buildHeaders(session),
    body: JSON.stringify({ path, content, sessionId: session.sessionId }),
  });

  if (!response.ok) {
    throw new Error(`Container save failed (${response.status})`);
  }
  return { proxied: true, ...(await response.json()) };
};

export const executeInContainer = async (session, payload) => {
  const baseUrl = getSessionApiBaseUrl(session);
  if (!baseUrl) return null;

  const labType = resolveLabType({
    labId: session.labId,
    language: payload.language,
    labType: payload.labType,
  });

  const body = {
    path: payload.path,
    filePath: payload.path,
    content: payload.content,
    code: payload.content,
    language: payload.language,
    labType,
    labId: session.labId,
    sessionId: session.sessionId,
  };

  for (const path of ["/api/run", "/execute"]) {
    try {
      const response = await containerFetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: buildHeaders(session),
        body: JSON.stringify(body),
        timeout: 5000, // Fail fast in 5 seconds if connection hangs/blocks
      });
      const data = await response.json();
      return {
        success: data.success !== false,
        output: data.output || "",
        error: data.error || data.runtimeError || data.syntaxError || null,
        syntaxError: data.syntaxError || "",
        runtimeError: data.runtimeError || "",
      };
    } catch (err) {
      if (path === "/execute") throw err;
    }
  }
  return null;
};
