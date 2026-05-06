import json
import os
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib import request, error

import boto3


def _json(handler: BaseHTTPRequestHandler, status: int, payload: dict):
    raw = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(raw)))
    handler.end_headers()
    handler.wfile.write(raw)


def _read_json(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("Content-Length", "0") or "0")
    raw = handler.rfile.read(length) if length else b"{}"
    try:
        return json.loads(raw.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return {}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def do_GET(self):
        if self.path == "/health":
            return _json(self, 200, {"ok": True})
        return _json(self, 404, {"ok": False})

    def do_POST(self):
        if self.path != "/runs":
            return _json(self, 404, {"success": False, "message": "not found"})

        region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "ap-south-1"
        sessions_table = os.environ["SESSIONS_TABLE_NAME"]
        runs_table = os.environ["RUNS_TABLE_NAME"]

        body = _read_json(self)
        session_id = body.get("sessionId")
        lab_type = body.get("labType") or body.get("labId") or ""
        code = body.get("content", body.get("code", "")) or ""
        run_mode = (body.get("runMode") or "run").lower()
        raw_path = body.get("path") or body.get("filePath") or ""

        if not session_id or not lab_type:
            return _json(self, 400, {"success": False, "message": "sessionId and labType are required"})

        ddb = boto3.resource("dynamodb", region_name=region)
        sess = ddb.Table(sessions_table).get_item(Key={"sessionId": session_id}).get("Item")
        if not sess:
            return _json(self, 404, {"success": False, "message": "Session not found"})
        if int(time.time()) >= int(sess.get("expiryTime", 0) or 0):
            return _json(self, 400, {"success": False, "message": "Session expired"})

        task_ip = (sess.get("taskPrivateIp") or "").strip()
        task_port = int(sess.get("taskPort") or 8080)
        token = (sess.get("sessionToken") or "").strip()
        if not task_ip:
            return _json(self, 409, {"success": False, "message": "Session container not ready"})

        run_id = f"run_{uuid.uuid4().hex[:12]}"
        expiry_time = int(time.time()) + (2 * 3600)
        ddb.Table(runs_table).put_item(
            Item={
                "runId": run_id,
                "sessionId": session_id,
                "labType": lab_type,
                "status": "RUNNING",
                "createdAt": int(time.time()),
                "expiryTime": expiry_time,
            }
        )

        url = f"http://{task_ip}:{task_port}/execute"
        req_body = json.dumps(
            {"sessionId": session_id, "labType": lab_type, "code": code, "path": raw_path, "runMode": run_mode}
        ).encode("utf-8")

        req = request.Request(
            url,
            data=req_body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "X-Session-Token": token,
            },
        )

        try:
            with request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
                result = json.loads(raw or "{}")
        except error.HTTPError as exc:
            body_txt = exc.read().decode("utf-8") if exc.fp else ""
            result = {
                "success": False,
                "output": "",
                "syntaxError": "",
                "runtimeError": f"Container error: {exc.code} {body_txt}",
            }
        except Exception as exc:
            result = {
                "success": False,
                "output": "",
                "syntaxError": "",
                "runtimeError": f"Failed to reach container: {exc}",
            }

        status = "COMPLETED" if result.get("success") else "FAILED"
        ddb.Table(runs_table).update_item(
            Key={"runId": run_id},
            UpdateExpression="SET #s = :s, success = :ok, output = :o, syntaxError = :se, runtimeError = :re, completedAt = :t",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":s": status,
                ":ok": bool(result.get("success")),
                ":o": result.get("output", ""),
                ":se": result.get("syntaxError", ""),
                ":re": result.get("runtimeError", ""),
                ":t": int(time.time()),
            },
        )

        return _json(
            self,
            200,
            {
                "success": bool(result.get("success")),
                "runId": run_id,
                "status": status,
                "output": result.get("output", ""),
                "syntaxError": result.get("syntaxError", ""),
                "runtimeError": result.get("runtimeError", ""),
            },
        )


def main():
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    httpd = ThreadingHTTPServer((host, port), Handler)
    httpd.serve_forever()


if __name__ == "__main__":
    main()

