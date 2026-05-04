import os
import platform
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from fastapi import Body, FastAPI

app = FastAPI(title="Python Lab Runtime", version="1.0.0")

WORKSPACE = Path(os.environ.get("LAB_WORKSPACE", "/workspace"))


def _safe_workspace_path(raw_path: str) -> Path:
    """Resolve path under WORKSPACE; reject traversal."""
    if not raw_path:
        return WORKSPACE / "untitled.py"
    p = Path(raw_path)
    if p.is_absolute():
        parts = p.parts
        if len(parts) >= 2 and parts[1] == "workspace":
            rel = Path(*parts[2:]) if len(parts) > 2 else Path("untitled.py")
        else:
            rel = Path(*parts[1:]) if len(parts) > 1 else Path("untitled.py")
    else:
        rel = p
    rel = Path(*[x for x in rel.parts if x not in ("..", "")])
    out = (WORKSPACE / rel).resolve()
    try:
        out.relative_to(WORKSPACE.resolve())
    except ValueError:
        return WORKSPACE / "untitled.py"
    return out


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/")
def info():
    return {
        "message": "Ephemeral lab environment is running.",
        "lab_type": os.getenv("LAB_TYPE", "python"),
        "python_version": platform.python_version(),
        "hostname": platform.node(),
    }


@app.post("/api/run")
def api_run(payload: dict = Body(default_factory=dict)):
    """
    Execute student code inside the lab container (Ignito IDE proxy).
    Expects: path, language, content (source text). Optional: sessionId (ignored).
    """
    raw_path = payload.get("path") or "/workspace/main.py"
    language = (payload.get("language") or "python").lower()
    content = payload.get("content")
    if content is None:
        content = ""

    target = _safe_workspace_path(raw_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8", newline="\n")

    def run_cmd(cmd: list[str], cwd: Path, timeout: int):
        return subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(cwd),
        )

    try:
        if language in ("python", "py"):
            chk = run_cmd(["python", "-m", "py_compile", str(target)], WORKSPACE, 30)
            if chk.returncode != 0:
                err = (chk.stderr or chk.stdout or "").strip()
                return {"success": False, "output": "", "error": err or "Syntax error"}
            proc = run_cmd(["python", str(target)], WORKSPACE, 120)
        elif language in ("bash", "shell", "sh"):
            proc = run_cmd(["bash", str(target)], WORKSPACE, 120)
        else:
            return {
                "success": False,
                "output": "",
                "error": f"Language '{language}' is not supported in this lab image.",
            }

        out = (proc.stdout or "").strip()
        err = (proc.stderr or "").strip()
        ok = proc.returncode == 0
        combined = out
        if ok and err:
            combined = (out + "\n" + err).strip()
        return {
            "success": ok,
            "output": combined if ok else out,
            "error": "" if ok else (err or out or f"Process exited with code {proc.returncode}"),
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "output": "", "error": "Execution timed out"}
    except Exception as e:
        return {"success": False, "output": "", "error": str(e)}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("LAB_PORT", "8888"))
    uvicorn.run(app, host="0.0.0.0", port=port)
