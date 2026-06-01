import { ok } from "../lib/apigw.js";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { getSession } from "../services/sessionRepository.js";
import { createRun, getRun, completeRun } from "../services/runRepository.js";
import { getFile, upsertFile } from "../services/fileRepository.js";
import { executeInContainer, saveToContainer } from "../services/containerClient.js";
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
  if (code && filePath) {
    const name = filePath.split("/").pop();
    // Automatically save it so that the file is persisted and updated in the container/DB
    await upsertFile(sessionId, { path: filePath, content: code, name, language });
    if (session.status === "running") {
      try {
        await saveToContainer(session, { path: filePath, content: code });
      } catch (err) {
        console.warn(`[runsCreateHandler] container proxy save skipped: ${err.message}`);
      }
    }
  } else if (!code && filePath) {
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

  console.log("\n=========================================");
  console.log("             RUN CODE REQUEST            ");
  console.log("=========================================");
  console.log(`Session ID:  ${sessionId}`);
  console.log(`Lab ID:      ${session.labId}`);
  console.log(`Lab Type:    ${labType}`);
  console.log(`Language:    ${language || "unknown"}`);
  console.log(`File Path:   ${filePath || "ad-hoc code run"}`);
  console.log(`Code length: ${code.length} chars`);

  let result;
  const host = session.publicIp || session.taskPrivateIp;
  const port = session.containerPort || 8080;
  const baseUrl = host ? `http://${host}:${port}` : null;

 let isReachable = false;

if (session.status === "running" && baseUrl) {

  console.log(
    `[Reachability Check] AUTO-BYPASS FOR ECS TASK`
  );

  isReachable = true;
}
  if (session.status === "running" && baseUrl) {
    if (process.env.FORCE_CONTAINER_EXECUTION === "true") {
      console.log(`[Reachability Check] BYPASSED because FORCE_CONTAINER_EXECUTION=true is set in your .env file.`);
      isReachable = true;
    } else {
      console.log(`[Reachability Check] Checking container at ${baseUrl}...`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const healthResponse = await fetch(`${baseUrl}/health`, {
          method: "GET",
          signal: controller.signal,
        });
        
        if (!healthResponse.ok && healthResponse.status !== 404) {
          throw new Error(`Health check failed: ${healthResponse.status}`);
        }
        isReachable = true;
        console.log(`[Reachability Check] Container is alive and reachable.`);
      } catch (err) {
        console.log(`[Reachability Check] Container check failed (unreachable/blocked): ${err.message}`);
      } finally {
        clearTimeout(timer);
      }
    }
  }

  let didContainerFail = false;
  if (session.status === "running" && host && isReachable) {
    console.log("-----------------------------------------");
    console.log(`[EXECUTION SOURCE] >> CONTAINER (AWS Fargate)`);
    console.log(`Container Host:   ${host}`);
    console.log("-----------------------------------------");
    try {
      console.log(`[Container Run] Sending execution request to container...`);
      console.log("EXECUTING INSIDE ECS CONTAINER");
      result = await executeInContainer(session, payload);
      
      console.log(`[Container Run] Raw Result:`);
      console.log(JSON.stringify(result, null, 2));
      
      if (!result) {
        throw new Error("No response received from container execution server.");
      }
    } catch (err) {
      didContainerFail = true;
      console.log(`[Runs Handler] Container run threw exception: ${err.message}.`);
      result = {
        success: false,
        output: "",
        error: `[Container Error] ${err.message}`,
        runtimeError: err.message,
      };
    }
  }

  if (session.status !== "running" || !host || !isReachable) {
    console.log("-----------------------------------------");
    console.log("[EXECUTION SOURCE] >> LOCAL FALLBACK");
    console.log(`Reason:            ${!isReachable && host ? "Container is unreachable (blocked/offline)" : `Session status is "${session.status}"`}`);
    console.log("-----------------------------------------");
    const local = await executeLocally(payload);
    result = {
      success: !local.error,
      output: local.output,
      error: local.error,
      runtimeError: local.error,
    };
  }

  console.log("-----------------------------------------");
  console.log("            EXECUTION RESULTS            ");
  console.log("-----------------------------------------");
  console.log(`Success:  ${result.success}`);
  console.log(`Output:\n${result.output || "(no output)"}`);
  if (result.error) {
    console.log(`Error:\n${result.error}`);
  }
  console.log("=========================================\n");

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
