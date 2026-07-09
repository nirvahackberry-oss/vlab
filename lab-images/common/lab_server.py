#!/usr/bin/env python3
"""Small HTTP server inside ECS lab tasks: POST /execute runs learner code (warm session)."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
from urllib.request import urlopen

LAB_WORKSPACE = os.environ.get("LAB_WORKSPACE", "/workspace").rstrip("/") or "/workspace"
PORT = int(os.environ.get("LAB_SERVER_PORT", "8080"))
SESSION_TOKEN = (os.environ.get("SESSION_TOKEN") or "").strip()
SESSION_ID = (os.environ.get("SESSION_ID") or "").strip()
LAB_TYPE_ENV = (os.environ.get("LAB_TYPE") or "").strip().lower()

SUPPORTED_LABS = frozenset({
    "python", "java", "linux", "dbms", "mysql", "postgres", "postgresql", "oracle",
    "agilemethodology", "agile", "bigdata",
    "javascript", "testing", "android", "android-emulator", "dotnet", "csharp", "c#",
    "softwareengeering",
})

DEFAULT_FILES = {
    "python": "main.py",
    "bigdata": "Main.java",
    "java": "Main.java",
    "linux": "script.sh",
    "dbms": "query.sql",
    "mysql": "query.sql",
    "postgres": "query.sql",
    "postgresql": "query.sql",
    "oracle": "query.sql",
    "javascript": "script.js",
    "agile": "Main.java",
    "agilemethodology": "Main.java",
    "softwareengeering": "script.java",
    "testing": "test.java",
    "android": "SecondActivity.java",
    "android-emulator": "SecondActivity.java",
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


def _jar_paths_from_dirs(*dirs: str) -> list[str]:
    paths: list[str] = []
    for libs_dir in dirs:
        if not os.path.isdir(libs_dir):
            continue
        for name in sorted(os.listdir(libs_dir)):
            if name.endswith(".jar"):
                paths.append(os.path.join(libs_dir, name))
    return paths


def _dir_has_jars(libs_dir: str) -> bool:
    if not os.path.isdir(libs_dir):
        return False
    return any(name.endswith(".jar") for name in os.listdir(libs_dir))


def _has_failsafe_jar(*dirs: str) -> bool:
    for libs_dir in dirs:
        if not os.path.isdir(libs_dir):
            continue
        for name in os.listdir(libs_dir):
            if name.endswith(".jar") and "failsafe" in name.lower():
                return True
    return False


def _ensure_testing_selenium_libs(selenium_lib: str, workspace_lib: str) -> None:
    os.makedirs(workspace_lib, exist_ok=True)
    if _has_failsafe_jar(selenium_lib, workspace_lib):
        return

    dest = os.path.join(workspace_lib, "failsafe-3.3.2.jar")
    if os.path.isfile(dest):
        return

    try:
        subprocess.run(
            [
                "curl",
                "-fsSL",
                "-o",
                dest,
                "https://repo1.maven.org/maven2/dev/failsafe/failsafe/3.3.2/failsafe-3.3.2.jar",
            ],
            capture_output=True,
            timeout=30,
            check=True,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return


def _java_classpath(src_dir: str, lab_type: str) -> tuple[str, str]:
    paths = [src_dir]
    warning = ""
    if lab_type == "bigdata":
        libs_dir = (os.environ.get("BIGDATA_LIBS") or "/opt/bigdata-libs").strip()
        paths.extend(_jar_paths_from_dirs(libs_dir))
    elif lab_type == "testing":
        selenium_lib = (os.environ.get("SELENIUM_LIBS") or "/opt/selenium/lib").strip()
        workspace_lib = os.path.join(_workspace_real(), "lib")
        _ensure_testing_selenium_libs(selenium_lib, workspace_lib)

        has_libs = False
        for libs_dir in (selenium_lib, workspace_lib):
            if _dir_has_jars(libs_dir):
                paths.append(os.path.join(libs_dir, "*"))
                has_libs = True
        if not has_libs:
            warning = (
                "[Selenium] Warning: no Selenium JARs found; "
                "add jars to /opt/selenium/lib or workspace/lib\n"
            )
        elif not _has_failsafe_jar(selenium_lib, workspace_lib):
            warning = (
                "[Selenium] Warning: failsafe JAR missing; "
                "rebuild the testing lab image or add failsafe-3.3.2.jar to workspace/lib\n"
            )
    return os.pathsep.join(paths), warning


def _is_java_code(code: str, path: str) -> bool:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".java":
        return True
    stripped = code.lstrip()
    return (
        stripped.startswith("import java.")
        or stripped.startswith("public class")
        or "org.openqa.selenium" in code
    )


def _prepare_testing_java_runtime(src_dir: str) -> None:
    chromedriver_src = (os.environ.get("CHROMEDRIVER_PATH") or "/usr/bin/chromedriver").strip()
    chromedriver_link = os.path.join(src_dir, "chromedriver")
    if os.path.lexists(chromedriver_link):
        return
    try:
        os.symlink(chromedriver_src, chromedriver_link)
    except OSError:
        pass


def _run_java(path: str, code: str, lab_type: str = "java") -> tuple[bool, str, str, str]:
    import re
    # Extract the main class name from the Java code to determine the correct filename and execution target
    class_match = re.search(r'\bpublic\s+class\s+([a-zA-Z0-9_]+)', code)
    if not class_match:
        class_match = re.search(r'\bclass\s+([a-zA-Z0-9_]+)', code)
    
    class_name = class_match.group(1) if class_match else "Main"
    
    src_dir = os.path.dirname(path) or _workspace_real()
    actual_path = os.path.join(src_dir, f"{class_name}.java")
    classpath, selenium_warning = _java_classpath(src_dir, lab_type)

    if lab_type == "testing":
        _prepare_testing_java_runtime(src_dir)

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
            err = selenium_warning + (jc.stderr or jc.stdout or "").strip()
            return False, "", err, "javac failed"
        java_cmd = ["java"]
        if lab_type == "testing":
            chromedriver = (os.environ.get("CHROMEDRIVER_PATH") or "/usr/bin/chromedriver").strip()
            java_cmd.append(f"-Dwebdriver.chrome.driver={chromedriver}")
        java_cmd.extend(["-cp", classpath, class_name])
        jr = subprocess.run(
            java_cmd,
            cwd=src_dir,
            capture_output=True,
            text=True,
            timeout=25,
        )
        out = selenium_warning + (jr.stdout or "") + (jr.stderr or "")
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


def _dbms_lab_engine(lab_type: str, code: str) -> str:
    if lab_type == "mysql":
        return "mysql"
    if lab_type in {"postgres", "postgresql"}:
        return "postgres"
    if lab_type == "oracle":
        return "oracle"
    return _dbms_engine(code)


def _run_dbms(path: str, code: str, lab_type: str = "dbms") -> tuple[bool, str, str, str]:
    with open(path, "w", encoding="utf-8") as f:
        f.write(code)
    engine = _dbms_lab_engine(lab_type, code)
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


def _run_testing(path: str, code: str) -> tuple[bool, str, str, str]:
    if _is_java_code(code, path):
        return _run_java(path, code, "testing")
    return _run_python(path, code)


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
    if lab_type == "android-emulator":
        lab_type = "android"
    if lab_type in ("c#", "csharp", "cs"):
        lab_type = "dotnet"
    if lab_type in ("software-eng", "softwareengineering", "software_engineering"):
        lab_type = "softwareengeering"
    if lab_type == "postgresql":
        lab_type = "postgres"
    return lab_type


def _bootstrap_root_for_target(target: str) -> str:
    normalized = (target or "workspace").strip().lower()
    if normalized in {"workspace", "workdir", "lab"}:
        return _workspace_real()
    if normalized in {"snippet", "console", "dotnet-snippet"}:
        return os.path.realpath(_dotnet_snippet_dir())
    if normalized in {"opt", "dotnet-snippet"}:
        return os.path.realpath(_dotnet_snippet_dir())
    if os.path.isabs(target):
        return os.path.realpath(target)
    return os.path.realpath(os.path.join(_workspace_real(), target.lstrip("/")))


def _download_archive(archive_url: str, dest_path: str) -> None:
    with urlopen(archive_url, timeout=120) as response:
        with open(dest_path, "wb") as out_file:
            shutil.copyfileobj(response, out_file)


def _extract_archive(archive_path: str, dest_dir: str) -> None:
    dest = os.path.realpath(dest_dir)
    os.makedirs(dest, exist_ok=True)
    with tarfile.open(archive_path, "r:gz") as tar:
        for member in tar.getmembers():
            member_path = os.path.realpath(os.path.join(dest, member.name))
            if not member_path.startswith(dest + os.sep) and member_path != dest:
                raise ValueError(f"unsafe path in archive: {member.name}")
        if sys.version_info >= (3, 12):
            tar.extractall(dest, filter="data")
        else:
            tar.extractall(dest)


def _run_command(cmd: list[str], cwd: str | None = None, timeout: int = 180) -> tuple[bool, str]:
    try:
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError) as exc:
        return False, str(exc)
    output = ((proc.stdout or "") + (proc.stderr or "")).strip()
    if proc.returncode != 0:
        return False, output or f"exit {proc.returncode}"
    return True, output


def _bootstrap_android_hook(workspace: str) -> tuple[bool, str]:
    android_home = (os.environ.get("ANDROID_HOME") or "/opt/android-sdk").strip()
    local_props = os.path.join(workspace, "local.properties")
    with open(local_props, "w", encoding="utf-8") as handle:
        handle.write(f"sdk.dir={android_home}\n")
    gradle_version = (os.environ.get("GRADLE_VERSION") or "8.2").strip()
    if not os.path.isfile(os.path.join(workspace, "gradlew")):
        ok, output = _run_command(
            ["gradle", "wrapper", f"--gradle-version={gradle_version}"],
            cwd=workspace,
        )
        if not ok:
            return False, output
    for name in ("gradlew", "build.sh"):
        path = os.path.join(workspace, name)
        if os.path.isfile(path):
            try:
                os.chmod(path, 0o755)
            except OSError:
                pass
    return True, "android starter prepared"


def _bootstrap_dotnet_restore(project_dir: str) -> tuple[bool, str]:
    if not os.path.isdir(project_dir):
        return False, f"dotnet project not found at {project_dir}"
    return _run_command(["dotnet", "restore", project_dir, "--nologo"], cwd=project_dir)


def _bootstrap_preset_hook(preset: str, target_root: str) -> tuple[bool, str]:
    preset_name = (preset or "generic").strip().lower()
    if preset_name == "android":
        return _bootstrap_android_hook(target_root)
    if preset_name in {"dotnet-mvc", "dotnet-web"}:
        project = os.path.join(target_root, "MyWebApp")
        return _bootstrap_dotnet_restore(project)
    if preset_name in {"dotnet-console", "dotnet-snippet"}:
        return _bootstrap_dotnet_restore(target_root)
    if preset_name == "dotnet":
        messages: list[str] = []
        web_project = os.path.join(_workspace_real(), "MyWebApp")
        snippet_dir = _dotnet_snippet_dir()
        if os.path.isdir(web_project):
            ok, output = _bootstrap_dotnet_restore(web_project)
            if not ok:
                return False, output
            messages.append(output or "restored MyWebApp")
        if os.path.isdir(snippet_dir):
            ok, output = _bootstrap_dotnet_restore(snippet_dir)
            if not ok:
                return False, output
            messages.append(output or "restored console snippet")
        return True, "; ".join(messages) or "dotnet assets prepared"
    return True, f"preset {preset_name} extracted"


def _bootstrap_archive(archive_url: str, target: str, preset: str) -> dict:
    if not archive_url:
        return {"success": False, "message": "archiveUrl is required"}
    target_root = _bootstrap_root_for_target(target)
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            archive_path = os.path.join(tmpdir, "bootstrap.tar.gz")
            _download_archive(archive_url, archive_path)
            _extract_archive(archive_path, target_root)
        ok, output = _bootstrap_preset_hook(preset, target_root)
        if not ok:
            return {"success": False, "message": output, "target": target_root}
        return {
            "success": True,
            "message": output or "archive bootstrapped",
            "target": target_root,
            "preset": preset or "generic",
        }
    except (OSError, ValueError, tarfile.TarError) as exc:
        return {"success": False, "message": f"archive bootstrap failed: {exc}"}


def _bootstrap_android_starter(archive_url: str) -> dict:
    script = "/usr/local/bin/bootstrap-android-starter.sh"
    if os.path.isfile(script):
        if not archive_url:
            return {"success": False, "message": "archiveUrl is required"}
        try:
            proc = subprocess.run(
                [script, archive_url],
                capture_output=True,
                text=True,
                timeout=180,
            )
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError) as exc:
            return {"success": False, "message": f"Android starter bootstrap failed: {exc}"}
        output = ((proc.stdout or "") + (proc.stderr or "")).strip()
        if proc.returncode != 0:
            return {
                "success": False,
                "message": output or f"bootstrap exit {proc.returncode}",
            }
        return {
            "success": True,
            "message": output or "Android starter bootstrapped",
            "workspace": _workspace_real(),
        }
    return _bootstrap_archive(archive_url, "workspace", "android")


def _default_bootstrap_preset(lab_type: str) -> str:
    if lab_type in ("android", "android-emulator"):
        return "android"
    if lab_type in ("dotnet", "csharp", "c#"):
        return "dotnet"
    if lab_type == "datascience":
        return "datascience"
    return "generic"


def _session_bootstrap_from_env() -> dict | None:
    archive_url = (os.environ.get("LAB_BOOTSTRAP_URL") or os.environ.get("ANDROID_STARTER_URL") or "").strip()
    console_url = (os.environ.get("LAB_BOOTSTRAP_CONSOLE_URL") or "").strip()
    if not archive_url and not console_url:
        return None

    lab_type = _normalize_lab_type({"labType": LAB_TYPE_ENV})
    preset = (os.environ.get("LAB_BOOTSTRAP_PRESET") or "").strip().lower() or _default_bootstrap_preset(lab_type)
    target = (os.environ.get("LAB_BOOTSTRAP_TARGET") or "workspace").strip()

    result: dict | None = None
    if archive_url:
        if lab_type == "android" and preset in {"", "generic", "android"}:
            result = _bootstrap_android_starter(archive_url)
        else:
            result = _bootstrap_archive(archive_url, target, preset)
        if not result.get("success"):
            return result

    if console_url:
        extra = _bootstrap_archive(
            console_url,
            (os.environ.get("LAB_BOOTSTRAP_CONSOLE_TARGET") or "dotnet-snippet").strip(),
            "dotnet-console",
        )
        if not extra.get("success"):
            return extra
        if result is None:
            return extra
        result["console"] = extra

    return result or {"success": False, "message": "no bootstrap archive configured"}


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

    if lab_type == "testing":
        ok, out, se, re = _run_testing(path, code)
    elif lab_type == "python":
        ok, out, se, re = _run_python(path, code)
    elif lab_type in ("dotnet", "csharp", "c#"):
        ok, out, se, re = _run_dotnet(path, code)
    elif lab_type in ("java", "bigdata", "agile", "agilemethodology", "softwareengeering"):
        ok, out, se, re = _run_java(path, code, lab_type)
    elif lab_type in ("linux", "android"):
        ok, out, se, re = _run_linux(path, code)
    elif lab_type == "javascript":
        ok, out, se, re = _run_javascript(path, code)
    elif lab_type in ("mysql", "postgres", "oracle", "dbms"):
        ok, out, se, re = _run_dbms(path, code, lab_type)
    else:
        return {
            "success": False,
            "output": "",
            "syntaxError": "",
            "runtimeError": f"lab_server: unhandled labType {lab_type!r}",
        }

    return {
        "success": ok,
        "output": out,
        "syntaxError": se,
        "runtimeError": re,
    }


def _hdfs_health_status() -> str | None:
    hadoop_home = (os.environ.get("HADOOP_HOME") or "").strip()
    if not hadoop_home:
        return None

    hdfs_bin = shutil.which("hdfs")
    if not hdfs_bin:
        return "unavailable"

    try:
        safemode = subprocess.run(
            [hdfs_bin, "dfsadmin", "-safemode", "get"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if safemode.returncode != 0 or "OFF" not in (safemode.stdout or ""):
            return "starting"

        dfs_check = subprocess.run(
            [hdfs_bin, "dfs", "-test", "-d", "/"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if dfs_check.returncode == 0:
            return "ready"
        return "starting"
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return "starting"


def _health_payload() -> dict:
    payload = {"ok": True, "service": "lab_server"}
    hdfs = _hdfs_health_status()
    if hdfs is not None:
        payload["hdfs"] = hdfs
    return payload


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
            self._json(200, _health_payload())
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
    if "--session-bootstrap" in sys.argv:
        result = _session_bootstrap_from_env()
        if result is None:
            print("no bootstrap configuration found", file=sys.stderr)
            sys.exit(0)
        if not result.get("success"):
            print(result.get("message", "bootstrap failed"), file=sys.stderr)
            sys.exit(1)
        print(result.get("message", "bootstrap ok"))
        sys.exit(0)

    server = HTTPServer(("0.0.0.0", PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
