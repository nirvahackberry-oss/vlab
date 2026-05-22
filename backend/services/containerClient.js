import { getSessionApiBaseUrl } from "../lib/labTools.js";
import { resolveLabType } from "../lib/labTypeMapper.js";

const CONTAINER_TIMEOUT_MS = 35000;

const containerFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONTAINER_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
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
