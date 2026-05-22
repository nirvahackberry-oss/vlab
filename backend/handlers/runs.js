import { ok } from "../lib/apigw.js";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { getSession } from "../services/sessionRepository.js";
import { createRun, getRun, completeRun } from "../services/runRepository.js";
import { getFile } from "../services/fileRepository.js";
import { executeInContainer } from "../services/containerClient.js";
import { executeLocally } from "../services/localExecutor.js";
import { resolveLabType } from "../lib/labTypeMapper.js";

export const runsCreateHandler = async ({ body, auth }) => {
  const sessionId = body?.sessionId || body?.session_id;
  const filePath = body?.path || body?.filePath;
  const language = body?.language;
  const content = body?.content || body?.code;

  if (!sessionId) throw badRequest("sessionId is required");

  const session = await getSession(sessionId);
  if (!session) throw notFound("Session not found");
  if (session.userId !== auth.userId && auth.role !== "Super Admin") {
    throw forbidden("You do not own this session");
  }

  let code = content;
  if (!code && filePath) {
    const file = await getFile(sessionId, filePath);
    if (!file) throw notFound("File not found. Save your code before running.");
    code = file.content;
  }
  if (!code) throw badRequest("content or saved file path is required");

  const labType = resolveLabType({
    labId: session.labId,
    language,
    labType: body?.labType,
  });

  const run = await createRun({ sessionId, labType });
  const payload = { path: filePath, language, content: code, labType };

  let result;
  const host = session.publicIp || session.taskPrivateIp;
  if (session.status === "running" && host) {
    try {
      result = await executeInContainer(session, payload);
    } catch (err) {
      result = {
        success: false,
        output: "",
        error: err.message,
        runtimeError: err.message,
      };
    }
  } else {
    const local = await executeLocally(payload);
    result = {
      success: !local.error,
      output: local.output,
      error: local.error,
      runtimeError: local.error,
    };
  }

  await completeRun(run.runId, result);

  return ok({
    runId: run.runId,
    status: result.success ? "COMPLETED" : "FAILED",
    output: result.output,
    error: result.error,
    syntaxError: result.syntaxError || "",
    runtimeError: result.runtimeError || "",
    success: result.success,
  });
};

export const runsGetHandler = async ({ pathParameters, auth }) => {
  const runId = pathParameters?.runId;
  const run = await getRun(runId);
  if (!run) throw notFound("Run not found");

  const session = await getSession(run.sessionId);
  if (
    session &&
    session.userId !== auth.userId &&
    auth.role !== "Super Admin"
  ) {
    throw forbidden("You do not own this run");
  }

  return ok({
    runId: run.runId,
    sessionId: run.sessionId,
    status: run.status,
    success: run.success,
    output: run.output || "",
    error: run.error || run.runtimeError || "",
    syntaxError: run.syntaxError || "",
    runtimeError: run.runtimeError || "",
  });
};

/** Legacy frontend alias: POST /run */
export const runLegacyHandler = async (parsed) => {
  const sessionId =
    parsed.headers?.["x-session-id"] || parsed.queryStringParameters?.sessionId;
  return runsCreateHandler({
    ...parsed,
    body: {
      ...(parsed.body || {}),
      sessionId,
      path: parsed.body?.path,
      language: parsed.body?.language,
      content: parsed.body?.content,
    },
  });
};
