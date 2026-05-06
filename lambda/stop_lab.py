import json
import os

import boto3
from botocore.exceptions import ClientError


def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def _extract_session_id(event: dict) -> str:
    # Check path parameters first (RESTful)
    path_params = event.get("pathParameters")
    if path_params and "sessionId" in path_params:
        return path_params["sessionId"]
        
    if isinstance(event.get("body"), str):
        body = json.loads(event.get("body") or "{}")
        return body.get("sessionId", "")
    if isinstance(event.get("body"), dict):
        return event["body"].get("sessionId", "")
    return event.get("sessionId", "")


def lambda_handler(event, context):
    table_name = os.environ["DYNAMODB_TABLE_NAME"]
    region = os.environ["AWS_REGION"]
    cluster_arn = os.environ.get("ECS_CLUSTER_ARN", "")

    session_id = _extract_session_id(event)
    if not session_id:
        return _response(400, {"error": "sessionId is required"})

    ddb = boto3.resource("dynamodb", region_name=region).Table(table_name)
    lambda_client = boto3.client("lambda", region_name=region)
    ecs = boto3.client("ecs", region_name=region)

    session_record = ddb.get_item(Key={"sessionId": session_id}).get("Item")
    if not session_record:
        # Already cleaned up (idempotent success)
        return _response(200, {"sessionId": session_id, "status": "NOT_FOUND_OR_ALREADY_STOPPED"})

    task_arn = session_record.get("taskArn") or ""
    if cluster_arn and task_arn:
        try:
            ecs.stop_task(cluster=cluster_arn, task=task_arn, reason="Lab session stopped")
        except ClientError:
            # If task is already gone, continue cleanup.
            pass

    ddb.delete_item(Key={"sessionId": session_id})

    trigger = event.get("reason") if isinstance(event, dict) else None
    # Optional: auto-grade on stop/timeout if enabled.
    if trigger in {"AUTO_TIMEOUT", "EXPIRED_CLEANUP"} and os.environ.get("GRADE_LAB_LAMBDA_ARN"):
        lambda_client.invoke(
            FunctionName=os.environ["GRADE_LAB_LAMBDA_ARN"],
            InvocationType="Event",
            Payload=json.dumps({"sessionId": session_id, "trigger": "ON_LAB_END"}).encode("utf-8"),
        )

    return _response(200, {"sessionId": session_id, "status": "STOPPED"})
