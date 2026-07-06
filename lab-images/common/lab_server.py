#!/usr/bin/env python3
"""Small HTTP server inside ECS lab tasks: POST /execute runs learner code (warm session)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

LAB_WORKSPACE = os.environ.get("LAB_WORKSPACE", "/workspace").rstrip("/") or "/workspace"
PORT = int(os.environ.get("LAB_SERVER_PORT", "8080"))
SESSION_TOKEN = (os.environ.get("SESSION_TOKEN") or "").strip()
SESSION_ID = (os.environ.get("SESSION_ID") or "").strip()
LAB_TYPE_ENV = (os.environ.get("LAB_TYPE") or "").strip().lower()

SUPPORTED_LABS = frozenset({
    "python", "java", "linux", "dbms", "agilemethodology", "agile", "bigdata",
    "javascript", "testing", "android", "dotnet", "csharp", "c#",
})

DEFAULT_FILES = {
    "python": "main.py",
    "bigdata": "Main.java",
    "java": "Main.java",
    "linux": "script.sh",
    "dbms": "query.sql",
    "javascript": "script.js",
    "agile": "Main.java",
    "agilemethodology": "Main.java",
    "testing": "test.py",
    "android": "build.sh",
    "dotnet": "Program.cs",
    "csharp": "Program.cs",
    "c#": "Program.cs",
}


def _workspace_real() -> str:
    try:
        return os.path.realpath(LAB_WORKSPACE)
    except OSError:
        return os.path.abspath(LAB_WORKSPACE)


def _safe_target_path(rel: str) -> str | None:
    if not rel or rel.strip() == "":
        return None
    rel = rel.lstrip("/").replace("\\", "/")
    if ".." in rel.split("/"):
        return None
    full = os.path.realpath(os.path.join(_workspace_real(), rel))
    root = _workspace_real()
    if not full.startswith(root + os.sep) and full != root:
        return None
    return full


def _resolve_path(body: dict, lab_type: str) -> str:
    raw = (body.get("path") or body.get("filePath") or "").strip()
    rel = raw or DEFAULT_FILES.get(lab_type, "main.py")
    full = _safe_target_path(rel)
    if not full:
        full = os.path.join(_workspace_real(), rel.lstrip("/"))
    parent = os.path.dirname(full)
    if parent:
        os.makedirs(parent, exist_ok=True)
    return full


def _run_python(path: str, code: str) -> tuple[bool, str, str, str]:
    with open(path, "w", encoding="utf-8") as f:
        f.write(code)
    for exe in ("python3", "python"):
        try:
            proc = subprocess.run(
                [exe, path],
                cwd=_workspace_real(),
                capture_output=True,
                text=True,
                timeout=25,
            )
            out = (proc.stdout or "") + (proc.stderr or "")
            if proc.returncode == 0:
                return True, out, "", ""
            return False, out, "", f"exit code {proc.returncode}"
        except FileNotFoundError:
            continue
        except subprocess.TimeoutExpired:
            return False, "", "", "Execution timed out"
    return False, "", "", "Python interpreter not found"


def _java_classpath(src_dir: str, lab_type: str) -> str:
    paths = [src_dir]
    if lab_type == "bigdata":
        libs_dir = (os.environ.get("BIGDATA_LIBS") or "/opt/bigdata-libs").strip()
        if os.path.isdir(libs_dir):
            for name in sorted(os.listdir(libs_dir)):
                if name.endswith(".jar"):
                    paths.append(os.path.join(libs_dir, name))
    return os.pathsep.join(paths)


def _run_java(path: str, code: str, lab_type: str = "java") -> tuple[bool, str, str, str]:
    import re
    # Extract the main class name from the Java code to determine the correct filename and execution target
    class_match = re.search(r'\bpublic\s+class\s+([a-zA-Z0-9_]+)', code)
    if not class_match:
        class_match = re.search(r'\bclass\s+([a-zA-Z0-9_]+)', code)
    
    class_name = class_match.group(1) if class_match else "Main"
    
    src_dir = os.path.dirname(path) or _workspace_real()
    actual_path = os.path.join(src_dir, f"{class_name}.java")
    classpath = _java_classpath(src_dir, lab_type)
    
    with open(actual_path, "w", encoding="utf-8") as f:
        f.write(code)
        
    try:
        jc = subprocess.run(
            ["javac", "-cp", classpath, actual_path],
            cwd=src_dir,
            capture_output=True,
            text=True,
            timeout=25,
        )
        if jc.returncode != 0:
            err = (jc.stderr or jc.stdout or "").strip()
            return False, "", err, "javac failed"
        jr = subprocess.run(
            ["java", "-cp", classpath, class_name],
            cwd=src_dir,
            capture_output=True,
            text=True,
            timeout=25,
        )
        out = (jr.stdout or "") + (jr.stderr or "")
        if jr.returncode == 0:
            return True, out, "", ""
        return False, out, "", f"java exit {jr.returncode}"
    except FileNotFoundError:
        return False, "", "", "javac/java not found"
    except subprocess.TimeoutExpired:
        return False, "", "", "Execution timed out"


def _run_linux(path: str, code: str) -> tuple[bool, str, str, str]:
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(code)
    try:
        os.chmod(path, 0o755)
    except OSError:
        pass
    try:
        proc = subprocess.run(
            ["/bin/bash", path],
            cwd=_workspace_real(),
            capture_output=True,
            text=True,
            timeout=25,
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode == 0:
            return True, out, "", ""
        return False, out, "", f"exit code {proc.returncode}"
    except subprocess.TimeoutExpired:
        return False, "", "", "Execution timed out"


def _dbms_engine(code: str) -> str:
    for line in code.splitlines()[:5]:
        stripped = line.strip().lower()
        if stripped.startswith("-- engine:"):
            return stripped.split(":", 1)[1].strip()
    return os.environ.get("DBMS_ENGINE", "mysql").strip().lower()


def _run_mysql(path: str) -> tuple[bool, str, str, str]:
    user = os.environ.get("MYSQL_USER", "student")
    password = os.environ.get("MYSQL_PASSWORD", "student")
    database = os.environ.get("MYSQL_DATABASE", "labdb")
    try:
        with open(path, encoding="utf-8") as sql_file:
            proc = subprocess.run(
                [
                    "mysql",
                    "-h",
                    "localhost",
                    "-u",
                    user,
                    f"-p{password}",
                    database,
                ],
                stdin=sql_file,
                cwd=_workspace_real(),
                capture_output=True,
                text=True,
                timeout=25,
            )
        out = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode == 0:
            return True, out, "", ""
        return False, out, "", f"mysql exit {proc.returncode}"
    except FileNotFoundError:
        return False, "", "", "mysql client not found"
    except subprocess.TimeoutExpired:
        return False, "", "", "Execution timed out"


def _run_postgres(path: str) -> tuple[bool, str, str, str]:
    user = os.environ.get("POSTGRES_USER", "student")
    password = os.environ.get("POSTGRES_PASSWORD", "student")
    database = os.environ.get("POSTGRES_DB", "labdb")
    env = {**os.environ, "PGPASSWORD": password}
    try:
        proc = subprocess.run(
            [
                "psql",
                "-h",
                "localhost",
                "-U",
                user,
                "-d",
                database,
                "-f",
                path,
                "-v",
                "ON_ERROR_STOP=1",
            ],
            cwd=_workspace_real(),
            capture_output=True,
            text=True,
            timeout=25,
            env=env,
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode == 0:
            return True, out, "", ""
        return False, out, "", f"psql exit {proc.returncode}"
    except FileNotFoundError:
        return False, "", "", "psql not found"
    except subprocess.TimeoutExpired:
        return False, "", "", "Execution timed out"


def _run_oracle(path: str) -> tuple[bool, str, str, str]:
    password = os.environ.get("ORACLE_PASSWORD", "student")
    user = os.environ.get("APP_USER", "student")
    service = os.environ.get("ORACLE_SERVICE", "XEPDB1")
    connect = f"{user}/{password}@//localhost:1521/{service}"
    try:
        with open(path, encoding="utf-8") as sql_file:
            proc = subprocess.run(
                ["sqlplus", "-S", connect],
                stdin=sql_file,
                cwd=_workspace_real(),
                capture_output=True,
                text=True,
                timeout=60,
            )
        out = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode == 0:
            return True, out, "", ""
        return False, out, "", f"sqlplus exit {proc.returncode}"
    except FileNotFoundError:
        return False, "", "", "sqlplus not found"
    except subprocess.TimeoutExpired:
        return False, "", "", "Execution timed out"


def _run_dbms(path: str, code: str) -> tuple[bool, str, str, str]:
    with open(path, "w", encoding="utf-8") as f:
        f.write(code)
    engine = _dbms_engine(code)
    if engine == "oracle":
        return _run_oracle(path)
    if engine in {"postgres", "postgresql"}:
        return _run_postgres(path)
    return _run_mysql(path)
def _dotnet_snippet_dir() -> str:
    return (os.environ.get("DOTNET_SNIPPET_DIR") or "/opt/dotnet-snippet").strip()


def _dotnet_web_project() -> str:
    configured = (os.environ.get("DOTNET_WEB_PROJECT") or "MyWebApp").strip()
    if os.path.isabs(configured):
        return configured
    return os.path.join(_workspace_real(), configured)


def _is_dotnet_web_code(code: str, path: str) -> bool:
    normalized = path.replace("\\", "/").lower()
    if "/controllers/" in normalized or normalized.endswith("controller.cs"):
        return True
    if "/views/" in normalized or normalized.endswith(".cshtml"):
        return True
    lowered = code.lower()
    return (
        "microsoft.aspnetcore" in lowered
        or " : controller" in lowered
        or "viewdata[" in lowered
        or "entityframeworkcore" in lowered
    )


def _run_dotnet_console(path: str, code: str) -> tuple[bool, str, str, str]:
    snippet_dir = _dotnet_snippet_dir()
    if not os.path.isdir(snippet_dir):
        return False, "", "", f"dotnet snippet project not found at {snippet_dir}"

    program_path = os.path.join(snippet_dir, "Program.cs")
    with open(program_path, "w", encoding="utf-8") as f:
        f.write(code)

    try:
        proc = subprocess.run(
            ["dotnet", "run", "--project", snippet_dir, "--nologo"],
            cwd=snippet_dir,
            capture_output=True,
            text=True,
            timeout=60,
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode == 0:
            return True, out, "", ""
        return False, out, "", f"dotnet exit {proc.returncode}"
    except FileNotFoundError:
        return False, "", "", "dotnet SDK not found"
    except subprocess.TimeoutExpired:
        return False, "", "", "Execution timed out"


def _run_dotnet_web(path: str, code: str) -> tuple[bool, str, str, str]:
    web_root = _dotnet_web_project()
    if not os.path.isdir(web_root):
        return False, "", "", f"web project not found at {web_root}"

    rel = path.replace("\\", "/").lstrip("/")
    for prefix in ("MyWebApp/", "/workspace/MyWebApp/"):
        if rel.startswith(prefix):
            rel = rel[len(prefix):]
            break

    if not rel or rel == "Program.cs":
        rel = "Controllers/HomeController.cs"

    target = _safe_target_path(os.path.join("MyWebApp", rel))
    if not target:
        target = os.path.join(web_root, os.path.basename(rel))

    parent = os.path.dirname(target)
    if parent:
        os.makedirs(parent, exist_ok=True)

    with open(target, "w", encoding="utf-8") as f:
        f.write(code)

    try:
        proc = subprocess.run(
            ["dotnet", "build", web_root, "--nologo"],
            cwd=web_root,
            capture_output=True,
            text=True,
            timeout=90,
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode == 0:
            return True, out or "Build succeeded.", "", ""
        return False, out, "", f"dotnet build exit {proc.returncode}"
    except FileNotFoundError:
        return False, "", "", "dotnet SDK not found"
    except subprocess.TimeoutExpired:
        return False, "", "", "Build timed out"


def _run_dotnet(path: str, code: str) -> tuple[bool, str, str, str]:
    if _is_dotnet_web_code(code, path):
        return _run_dotnet_web(path, code)
    return _run_dotnet_console(path, code)


def _run_javascript(path: str, code: str) -> tuple[bool, str, str, str]:
    with open(path, "w", encoding="utf-8") as f:
        f.write(code)
    try:
        proc = subprocess.run(
            ["node", path],
            cwd=_workspace_real(),
            capture_output=True,
            text=True,
            timeout=25,
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode == 0:
            return True, out, "", ""
        return False, out, "", f"exit code {proc.returncode}"
    except FileNotFoundError:
        return False, "", "", "Node.js interpreter not found"
    except subprocess.TimeoutExpired:
        return False, "", "", "Execution timed out"

def _normalize_lab_type(body: dict) -> str:
    raw = (
        body.get("labType")
        or body.get("labId")
        or LAB_TYPE_ENV
        or body.get("language")
        or ""
    )
    lab_type = str(raw).strip().lower()
    if lab_type.endswith("-lab"):
        lab_type = lab_type.replace("-lab", "")
    if lab_type == "big-data":
        lab_type = "bigdata"
    if lab_type in ("mobile-app", "mobile"):
        lab_type = "android"
    if lab_type in ("c#", "csharp", "cs"):
        lab_type = "dotnet"
    return lab_type


def _save_file(body: dict) -> dict:
    path = _resolve_path(body, _normalize_lab_type(body) or "python")
    content = body.get("content", body.get("code", ""))
    if not isinstance(content, str):
        content = str(content)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return {"success": True, "path": path, "message": "File saved"}


def _execute(body: dict) -> dict:
    lab_type = _normalize_lab_type(body)
    code = body.get("content", body.get("code", ""))
    if not isinstance(code, str):
        code = str(code)

    if lab_type not in SUPPORTED_LABS:
        return {
            "success": False,
            "output": "",
            "syntaxError": "",
            "runtimeError": f"lab_server: unsupported labType {lab_type!r}",
        }

    path = _resolve_path(body, lab_type)

    if lab_type in ("python", "testing"):
        ok, out, se, re = _run_python(path, code)
    elif lab_type in ("dotnet", "csharp", "c#"):
        ok, out, se, re = _run_dotnet(path, code)
    elif lab_type in ("java", "bigdata", "agile", "agilemethodology"):
        ok, out, se, re = _run_java(path, code, lab_type)
    elif lab_type in ("linux", "android"):
        ok, out, se, re = _run_linux(path, code)
    elif lab_type == "javascript":
        ok, out, se, re = _run_javascript(path, code)
    else:
        ok, out, se, re = _run_dbms(path, code)

    return {
        "success": ok,
        "output": out,
        "syntaxError": se,
        "runtimeError": re,
    }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        return

    def _json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path in ("/", "/health"):
            self._json(200, {"ok": True, "service": "lab_server"})
            return
        self.send_error(404)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path not in ("/execute", "/api/run", "/api/save"):
            self.send_error(404)
            return

        if SESSION_TOKEN:
            token = (self.headers.get("X-Session-Token") or "").strip()
            if token != SESSION_TOKEN:
                self._json(
                    401,
                    {
                        "success": False,
                        "output": "",
                        "syntaxError": "",
                        "runtimeError": "Unauthorized",
                    },
                )
                return

        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._json(
                400,
                {
                    "success": False,
                    "output": "",
                    "syntaxError": "",
                    "runtimeError": "Invalid JSON body",
                },
            )
            return

        if SESSION_ID:
            sid = (body.get("sessionId") or "").strip()
            if sid and sid != SESSION_ID:
                self._json(
                    401,
                    {
                        "success": False,
                        "output": "",
                        "syntaxError": "",
                        "runtimeError": "sessionId mismatch",
                    },
                )
                return

        if parsed.path == "/api/save":
            result = _save_file(body)
            self._json(200, result)
            return

        result = _execute(body)
        normalized = {
            "success": result.get("success", False),
            "output": result.get("output", ""),
            "error": result.get("runtimeError") or result.get("syntaxError") or "",
            "syntaxError": result.get("syntaxError", ""),
            "runtimeError": result.get("runtimeError", ""),
        }
        self._json(200 if normalized.get("success") else 400, normalized)


def main() -> None:
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
