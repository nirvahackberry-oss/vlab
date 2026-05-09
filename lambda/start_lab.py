import base64
import json
import os
import uuid
from datetime import datetime, timedelta, timezone

import boto3

# Frontend routes often use slugs like "python-lab"; ECS/task map keys use "python".
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


def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def _parse_event_body(event: dict) -> dict:
    raw_body = event.get("body", "{}")
    if event.get("isBase64Encoded"):
        decoded = base64.b64decode(raw_body).decode("utf-8")
        return json.loads(decoded)
    if isinstance(raw_body, dict):
        return raw_body
    return json.loads(raw_body)


def _to_int(value, field_name: str) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be an integer")


def lambda_handler(event, context):
    region = os.environ["AWS_REGION"]
    table_name = os.environ["DYNAMODB_TABLE_NAME"]
    default_timeout = int(os.environ["DEFAULT_SESSION_TIMEOUT"])
    allowed_lab_types = set(os.environ.get("ALLOWED_LAB_TYPES", "").split(","))
    cluster_arn = os.environ["ECS_CLUSTER_ARN"]
    task_definition_map = json.loads(os.environ["LAB_TASK_DEFINITION_MAP"])
    subnet_ids = os.environ["ECS_SUBNET_IDS"].split(",")
    security_group_id = os.environ["ECS_SECURITY_GROUP_ID"]

    body = _parse_event_body(event)
    user_id = body.get("userId")
    # Accept labId as requested by the frontend (may be a slug e.g. python-lab)
    lab_id = body.get("labId", body.get("labType"))
    lab_type = _canonical_lab_type(lab_id)

    try:
        duration_minutes = _to_int(body.get("duration", default_timeout), "duration")
    except ValueError as exc:
        return _response(400, {"success": False, "message": str(exc)})
    additional_env = body.get("environment", {})

    if not user_id or not lab_id:
        return _response(400, {"success": False, "message": "userId and labId are required"})
    if lab_type not in allowed_lab_types:
        return _response(
            400,
            {"success": False, "message": f"Unsupported labId: {lab_id} (resolved type: {lab_type})"},
        )
    if duration_minutes <= 0:
        return _response(400, {"success": False, "message": "duration must be > 0"})

    session_id = f"sess_{str(uuid.uuid4())[:8]}"
    now_utc = datetime.now(timezone.utc)
    stop_at = now_utc + timedelta(minutes=duration_minutes)
    ttl_epoch = int((stop_at + timedelta(minutes=5)).timestamp())
    ddb = boto3.resource("dynamodb", region_name=region).Table(table_name)
    ecs = boto3.client("ecs", region_name=region)

    session_token = uuid.uuid4().hex

    ddb.put_item(
        Item={
            "sessionId": session_id,
            "userId": user_id,
            "labId": lab_id,
            "labType": lab_type,
            "startTime": now_utc.isoformat(),
            "expiryTime": ttl_epoch,
            "status": "starting",
            "sessionToken": session_token,
        }
    )

    if lab_type not in task_definition_map:
        return _response(400, {"success": False, "message": f"No task definition for labType: {lab_type}"})

    run_resp = ecs.run_task(
        cluster=cluster_arn,
        taskDefinition=task_definition_map[lab_type],
        launchType="FARGATE",
        count=1,
        networkConfiguration={
            "awsvpcConfiguration": {
                "subnets": subnet_ids,
                "securityGroups": [security_group_id],
                "assignPublicIp": "DISABLED",
            }
        },
        overrides={
            "containerOverrides": [
                {
                    "name": "lab-runtime",
                    "environment": [
                        {"name": "LAB_TYPE", "value": lab_type},
                        {"name": "SESSION_ID", "value": session_id},
                        {"name": "SESSION_TOKEN", "value": session_token},
                    ]
                    + [{"name": k, "value": str(v)} for k, v in (additional_env or {}).items()],
                }
            ]
        },
    )

    failures = run_resp.get("failures") or []
    if failures:
        ddb.update_item(
            Key={"sessionId": session_id},
            UpdateExpression="SET #s = :s, error = :e",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":s": "failed_to_start", ":e": json.dumps(failures)},
        )
        return _response(500, {"success": False, "message": "Failed to start lab container", "error": failures})

    task_arn = run_resp["tasks"][0]["taskArn"]

    # Best-effort: wait briefly for ENI private IP so execute_code can forward immediately.
    private_ip = None
    deadline = datetime.now(timezone.utc).timestamp() + 60
    while datetime.now(timezone.utc).timestamp() < deadline:
        desc = ecs.describe_tasks(cluster=cluster_arn, tasks=[task_arn])
        tasks = desc.get("tasks") or []
        if not tasks:
            continue
        t = tasks[0]
        if t.get("lastStatus") == "STOPPED":
            break
        for att in t.get("attachments") or []:
            if att.get("type") != "ElasticNetworkInterface":
                continue
            for d in att.get("details") or []:
                if d.get("name") == "privateIPv4Address":
                    private_ip = d.get("value")
                    break
            if private_ip:
                break
        if private_ip:
            break

    ddb.update_item(
        Key={"sessionId": session_id},
        UpdateExpression="SET #s = :s, taskArn = :t, taskPrivateIp = :ip, taskPort = :p",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":s": "running" if private_ip else "starting",
            ":t": task_arn,
            ":ip": private_ip or "",
            ":p": 8080,
        },
    )

    return _response(
        200,
        {
            "success": True,
            "sessionId": session_id,
            "labId": lab_id,
            "status": "running" if private_ip else "starting",
            "message": "Lab session started",
            "estimatedReadyInSeconds": 0 if private_ip else 30,
        },
    )

