import json
import os
import subprocess
import time
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse


def _json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict):
    raw = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(raw)))
    handler.end_headers()
    handler.wfile.write(raw)


def _read_body_json(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("Content-Length", "0") or "0")
    raw = handler.rfile.read(length) if length > 0 else b"{}"
    try:
        return json.loads(raw.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return {}


def _truncate(s: str, limit: int) -> str:
    if s is None:
        return ""
    if len(s) <= limit:
        return s
    return s[:limit] + "\n... (truncated)\n"


def _lab_defaults(lab_type: str) -> str | None:
    return {
        "python": "main.py",
        "java": "Main.java",
        "linux": "script.sh",
        "dbms": "query.sql",
    }.get(lab_type)


def _build_run_cmd(lab_type: str, filename: str) -> str | None:
    if lab_type == "python":
        return f"python -m py_compile '{filename}' && python '{filename}'"
    if lab_type == "linux":
        return f"bash -n '{filename}' && bash '{filename}'"
    if lab_type == "java":
        return "javac Main.java && java Main"
    if lab_type == "dbms":
        return "psql -U student -d labdb -f query.sql"
    return None


class Handler(BaseHTTPRequestHandler):
    server_version = "vlab-lab-server/1.0"

    def log_message(self, fmt, *args):
        # Keep logs minimal; ECS logs can get noisy.
        return

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            return _json_response(self, 200, {"ok": True})
        return _json_response(self, 404, {"ok": False, "error": "not found"})

    def do_POST(self):
        try:
            path = urlparse(self.path).path
            if path != "/execute":
                return _json_response(self, 404, {"success": False, "runtimeError": "not found"})

            expected = os.environ.get("SESSION_TOKEN", "")
            if expected:
                token = self.headers.get("X-Session-Token", "")
                if token != expected:
                    return _json_response(self, 401, {"success": False, "runtimeError": "unauthorized"})

            payload = _read_body_json(self)
            lab_type = (payload.get("labType") or payload.get("labId") or os.environ.get("LAB_TYPE") or "").strip()
            code = payload.get("content", payload.get("code", "")) or ""
            raw_path = (payload.get("path") or payload.get("filePath") or "").strip()

            if not lab_type:
                return _json_response(self, 400, {"success": False, "runtimeError": "labType is required"})

            default_filename = _lab_defaults(lab_type)
            if not default_filename:
                return _json_response(self, 400, {"success": False, "runtimeError": f"Unsupported labType: {lab_type}"})

            filename = default_filename
            if raw_path and lab_type in ("python", "linux"):
                base = raw_path.split("/")[-1].split("\\")[-1]
                if base:
                    filename = base

            if lab_type == "java":
                filename = "Main.java"
            if lab_type == "dbms":
                filename = "query.sql"

            run_cmd = _build_run_cmd(lab_type, filename)
            if not run_cmd:
                return _json_response(self, 400, {"success": False, "runtimeError": f"Unsupported labType: {lab_type}"})

            workspace = os.environ.get("LAB_WORKSPACE", "/workspace")
            os.makedirs(workspace, exist_ok=True)

            file_path = os.path.join(workspace, filename)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)

            timeout_s = int(os.environ.get("EXEC_TIMEOUT_SECONDS", "10") or "10")
            max_output = int(os.environ.get("MAX_OUTPUT_CHARS", "20000") or "20000")

            started = time.time()
            proc = subprocess.run(
                ["bash", "-lc", f"cd '{workspace}' && {run_cmd}"],
                capture_output=True,
                text=True,
                timeout=timeout_s,
            )
            elapsed_ms = int((time.time() - started) * 1000)

            stdout = proc.stdout or ""
            stderr = proc.stderr or ""

            # Preserve existing API fields.
            syntax_error = ""
            runtime_error = ""

            if proc.returncode != 0:
                # Treat the first failure stage as "syntax" for compile/check style steps.
                if lab_type in ("python", "linux", "java"):
                    syntax_error = _truncate(stderr or stdout, max_output)
                else:
                    runtime_error = _truncate(stderr or stdout, max_output)

            output = _truncate(stdout, max_output)
            runtime_error = _truncate(runtime_error, max_output)
            syntax_error = _truncate(syntax_error, max_output)

            return _json_response(
                self,
                200,
                {
                    "success": proc.returncode == 0,
                    "output": output,
                    "syntaxError": syntax_error,
                    "runtimeError": runtime_error,
                    "meta": {"exitCode": proc.returncode, "elapsedMs": elapsed_ms},
                },
            )
        except subprocess.TimeoutExpired:
            return _json_response(
                self,
                200,
                {"success": False, "output": "", "syntaxError": "", "runtimeError": "Execution timed out"},
            )
        except Exception:
            return _json_response(
                self,
                500,
                {"success": False, "output": "", "syntaxError": "", "runtimeError": traceback.format_exc()},
            )


def main():
    port = int(os.environ.get("LAB_SERVER_PORT", "8080") or "8080")
    host = os.environ.get("LAB_SERVER_HOST", "0.0.0.0")
    httpd = ThreadingHTTPServer((host, port), Handler)
    httpd.serve_forever()


if __name__ == "__main__":
    main()

