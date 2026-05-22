import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const runPython = (content) =>
  new Promise((resolve) => {
    const tempFile = path.join(os.tmpdir(), `vlab_${Date.now()}.py`);
    fs.writeFileSync(tempFile, content);
    const commands =
      process.platform === "win32"
        ? ["python", "py", "python3"]
        : ["python3", "python"];

    const tryExecute = (index) => {
      if (index >= commands.length) {
        try {
          fs.unlinkSync(tempFile);
        } catch {}
        return resolve({
          success: true,
          output: "",
          error: "Python not found. Install Python and add it to PATH.",
        });
      }

      exec(`${commands[index]} "${tempFile}"`, { timeout: 30000 }, (error, stdout, stderr) => {
        if (
          error &&
          (error.message.includes("not recognized") ||
            error.message.includes("not found") ||
            error.code === 127 ||
            error.code === "ENOENT")
        ) {
          return tryExecute(index + 1);
        }

        try {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch {}

        resolve({
          success: true,
          output: stdout,
          error: stderr || (error ? (error.killed ? "Execution timed out (30s)" : error.message) : null),
        });
      });
    };

    tryExecute(0);
  });

const runJava = (content) =>
  new Promise((resolve) => {
    const classMatch = content.match(/public\s+class\s+([a-zA-Z0-9_]+)/);
    const className = classMatch ? classMatch[1] : "Main";
    const tempDir = path.join(os.tmpdir(), `vlab_java_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    const javaFile = path.join(tempDir, `${className}.java`);
    fs.writeFileSync(javaFile, content);

    exec(
      `javac "${javaFile}" && java -cp "${tempDir}" ${className}`,
      { timeout: 60000 },
      (error, stdout, stderr) => {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {}

        resolve({
          success: true,
          output: stdout,
          error: stderr || (error ? (error.killed ? "Execution timed out (60s)" : error.message) : null),
        });
      },
    );
  });

export const executeLocally = async ({ language, content }) => {
  if (language === "python") return runPython(content);
  if (language === "java") return runJava(content);

  return {
    success: true,
    output: `[System] Language "${language}" is not supported in local fallback mode.`,
    error: null,
  };
};
