import json
import os
from datetime import datetime, timezone

import boto3

_LAB_ID_ALIASES = {
    "python-lab": "python",
    "java-lab": "java",
    "linux-lab": "linux",
    "dbms-lab": "dbms",
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


def _parse_body(event: dict) -> dict:
    body = event.get("body", "{}")
    if isinstance(body, dict):
        return body
    return json.loads(body)


def lambda_handler(event, context):
    body = _parse_body(event)
    session_id = body.get("sessionId")
    code = body.get("code", "")
    trigger_grade = body.get("triggerGrade", True)

    if not session_id:
        return {"statusCode": 400, "body": json.dumps({"error": "sessionId is required"})}

    region = os.environ["AWS_REGION"]
    sessions_table = boto3.resource("dynamodb", region_name=region).Table(os.environ["SESSIONS_TABLE_NAME"])
    submissions_table = boto3.resource("dynamodb", region_name=region).Table(os.environ["SUBMISSIONS_TABLE_NAME"])
    lambda_client = boto3.client("lambda", region_name=region)

    session = sessions_table.get_item(Key={"sessionId": session_id}).get("Item")
    if not session:
        return {"statusCode": 404, "body": json.dumps({"error": "Session not found"})}

    resolved_type = session.get("labType") or _canonical_lab_type(session.get("labId", ""))

    item = {
        "sessionId": session_id,
        "userId": session.get("userId", "unknown"),
        "labType": resolved_type if resolved_type else "unknown",
        "code": code,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    submissions_table.put_item(Item=item)

    grade_result = None
    if trigger_grade:
        resp = lambda_client.invoke(
            FunctionName=os.environ["GRADE_LAB_LAMBDA_ARN"],
            InvocationType="RequestResponse",
            Payload=json.dumps({"sessionId": session_id, "trigger": "ON_SUBMIT"}).encode("utf-8"),
        )
        payload = resp["Payload"].read().decode("utf-8")
        grade_result = json.loads(payload) if payload else None

    return {
        "statusCode": 200,
        "body": json.dumps({"saved": True, "sessionId": session_id, "gradeResult": grade_result}),
    }
