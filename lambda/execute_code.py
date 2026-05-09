import json
import os
import time
import uuid
from urllib import request, error

import boto3

_LAB_ID_ALIASES = {
    "python-lab": "python",
    "java-lab": "java",
    "linux-lab": "linux",
    "dbms-lab": "dbms",
    "agilemethodology-lab": "agilemethodology",
    "android-lab": "android",
    "bigdata-lab": "bigdata",
    "datascience-lab": "datascience",
    "dotnet-lab": "dotnet",
    "softwareengeering-lab": "softwareengeering",
    "testing-lab": "testing",
}


def _canonical_lab_type(lab_id: str) -> str:
    if not lab_id:
        return lab_id
    extra = {}
    raw = os.environ.get("LAB_ID_ALIASES_JSON", "").strip()
    if raw:
        try:
            extra = json.loads(raw)
        except json.JSONDecodeError:
            extra = {}
    merged = {**_LAB_ID_ALIASES, **extra}
    return merged.get(lab_id, lab_id)


def _response(success: bool, syntax_error: str = "", runtime_error: str = "", output: str = ""):
    return {
        "statusCode": 200 if success else 400,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(
            {
                "success": success,
                "syntaxError": syntax_error,
                "runtimeError": runtime_error,
                "output": output,
            }
        ),
    }


def _parse_body(event: dict) -> dict:
    body = event.get("body", "{}")
    if isinstance(body, dict):
        return body
    return json.loads(body)


def _lab_commands(lab_type: str):
    # Return default filename only; the final command is built after we decide the filename.
    mapping = {
        "python": "main.py",
        "java": "Main.java",
        "linux": "script.sh",
        "dbms": "query.sql",
    }
    return mapping.get(lab_type)


def _wait_task_running(ecs_client, cluster_arn: str, task_arn: str, timeout: int = 120):
    deadline = time.time() + timeout
    while time.time() < deadline:
        resp = ecs_client.describe_tasks(cluster=cluster_arn, tasks=[task_arn])
        tasks = resp.get("tasks", [])
        if not tasks:
            time.sleep(3)
            continue
        status = tasks[0].get("lastStatus")
        if status == "STOPPED":
            return tasks[0]
        if status == "RUNNING":
            return tasks[0]
        time.sleep(3)
    return None


def _wait_task_stopped(ecs_client, cluster_arn: str, task_arn: str, timeout: int = 60):
    deadline = time.time() + timeout
    while time.time() < deadline:
        resp = ecs_client.describe_tasks(cluster=cluster_arn, tasks=[task_arn])
        tasks = resp.get("tasks", [])
        if tasks and tasks[0].get("lastStatus") == "STOPPED":
            return tasks[0]
        time.sleep(2)
    return None


def _read_logs(logs_client, log_group: str, log_stream: str, retries: int = 5) -> str:
    for _ in range(retries):
        try:
            resp = logs_client.get_log_events(
                logGroupName=log_group,
                logStreamName=log_stream,
                startFromHead=True,
            )
            return "\n".join(e["message"] for e in resp.get("events", []))
        except logs_client.exceptions.ResourceNotFoundException:
            time.sleep(2)
    return ""


def lambda_handler(event, context):
    body = _parse_body(event)
    session_id = body.get("sessionId")
    lab_type = _canonical_lab_type(body.get("labType") or body.get("labId") or "")
    # Support both legacy (code) and new (content) payloads
    code = body.get("content", body.get("code", ""))
    run_mode = (body.get("runMode") or "run").lower()
    raw_path = body.get("path") or body.get("filePath") or ""

    if not session_id or not lab_type:
        return _response(False, runtime_error="sessionId and labType (or labId) are required")

    region = os.environ["AWS_REGION"]

    # Validate session exists and is not expired
    sessions_table = os.environ["SESSIONS_TABLE_NAME"]
    sess = boto3.resource("dynamodb", region_name=region).Table(sessions_table).get_item(Key={"sessionId": session_id}).get("Item")
    if not sess:
        return _response(False, runtime_error="Session not found")
    if int(time.time()) >= int(sess.get("expiryTime", 0)):
        return _response(False, runtime_error="Session expired")

    runs_table = os.environ["RUNS_TABLE_NAME"]
    run_id = f"run_{uuid.uuid4().hex[:12]}"

    ddb = boto3.resource("dynamodb", region_name=region).Table(runs_table)

    # Write a queued run record (TTL 2 hours)
    expiry_time = int(time.time()) + (2 * 3600)
    ddb.put_item(
        Item={
            "runId": run_id,
            "sessionId": session_id,
            "labType": lab_type,
            "status": "QUEUED",
            "createdAt": int(time.time()),
            "expiryTime": expiry_time,
        }
    )

    # Warm session forwarding: call the already-running container.
    cluster_arn = os.environ["ECS_CLUSTER_ARN"]
    ecs = boto3.client("ecs", region_name=region)
    task_arn = (sess.get("taskArn") or "").strip()
    private_ip = (sess.get("taskPrivateIp") or "").strip()
    port = int(sess.get("taskPort") or 8080)

    if task_arn and not private_ip:
        desc = ecs.describe_tasks(cluster=cluster_arn, tasks=[task_arn])
        tasks = desc.get("tasks") or []
        if tasks:
            for att in tasks[0].get("attachments") or []:
                if att.get("type") != "ElasticNetworkInterface":
                    continue
                for d in att.get("details") or []:
                    if d.get("name") == "privateIPv4Address":
                        private_ip = d.get("value") or ""
                        break
                if private_ip:
                    break

    if not task_arn or not private_ip:
        ddb.update_item(
            Key={"runId": run_id},
            UpdateExpression="SET #s = :s, runtimeError = :e",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":s": "FAILED", ":e": "Session container not ready"},
        )
        return _response(False, runtime_error="Session container not ready")

    url = f"http://{private_ip}:{port}/execute"
    token = (sess.get("sessionToken") or "").strip()
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
        body = exc.read().decode("utf-8") if exc.fp else ""
        result = {"success": False, "output": "", "syntaxError": "", "runtimeError": f"Container error: {exc.code} {body}"}
    except Exception as exc:
        result = {"success": False, "output": "", "syntaxError": "", "runtimeError": f"Failed to reach container: {exc}"}

    # Persist run result immediately (keeps GET /runs/{runId} compatible).
    ddb.update_item(
        Key={"runId": run_id},
        UpdateExpression="SET #s = :s, success = :ok, output = :o, syntaxError = :se, runtimeError = :re, completedAt = :t",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":s": "COMPLETED" if result.get("success") else "FAILED",
            ":ok": bool(result.get("success")),
            ":o": result.get("output", ""),
            ":se": result.get("syntaxError", ""),
            ":re": result.get("runtimeError", ""),
            ":t": int(time.time()),
        },
    )

    # Optional: kick off grading on every run (expensive). This updates grade fields on the run record.
    if run_mode == "grade" and os.environ.get("GRADE_LAB_LAMBDA_ARN"):
        boto3.client("lambda", region_name=region).invoke(
            FunctionName=os.environ["GRADE_LAB_LAMBDA_ARN"],
            InvocationType="Event",
            Payload=json.dumps({"sessionId": session_id, "runId": run_id, "trigger": "ON_RUN"}).encode("utf-8"),
        )

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(
            {
                "success": bool(result.get("success")),
                "runId": run_id,
                "status": "COMPLETED" if result.get("success") else "FAILED",
                "output": result.get("output", ""),
                "syntaxError": result.get("syntaxError", ""),
                "runtimeError": result.get("runtimeError", ""),
            }
        ),
    }
