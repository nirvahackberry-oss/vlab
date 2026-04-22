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
    if isinstance(event.get("body"), str):
        body = json.loads(event.get("body") or "{}")
        return body.get("sessionId", "")
    if isinstance(event.get("body"), dict):
        return event["body"].get("sessionId", "")
    return event.get("sessionId", "")


def lambda_handler(event, context):
    table_name = os.environ["DYNAMODB_TABLE_NAME"]
    region = os.environ["AWS_REGION"]

    session_id = _extract_session_id(event)
    if not session_id:
        return _response(400, {"error": "sessionId is required"})

    ddb = boto3.resource("dynamodb", region_name=region).Table(table_name)
    ecs_client = boto3.client("ecs", region_name=region)
    scheduler = boto3.client("scheduler", region_name=region)
    lambda_client = boto3.client("lambda", region_name=region)

    session_record = ddb.get_item(Key={"sessionId": session_id}).get("Item")
    if not session_record:
        # Already cleaned up (idempotent success)
        return _response(200, {"sessionId": session_id, "status": "NOT_FOUND_OR_ALREADY_STOPPED"})

    task_arn = session_record.get("taskArn")
    schedule_id = session_record.get("scheduleId")
    cluster_arn = os.environ.get("ECS_CLUSTER_ARN") or session_record.get("clusterArn")

    if task_arn and cluster_arn:
        try:
            ecs_client.stop_task(
                cluster=cluster_arn,
                task=task_arn,
                reason=f"Session {session_id} stopped",
            )
        except ClientError as error:
            error_code = error.response["Error"].get("Code")
            if error_code not in {"TaskNotFoundException", "ClusterNotFoundException"}:
                raise

    if schedule_id:
        try:
            scheduler.delete_schedule(
                Name=schedule_id,
                GroupName=os.environ.get("SCHEDULER_GROUP_NAME", "default"),
            )
        except ClientError as error:
            error_code = error.response["Error"].get("Code")
            if error_code not in {"ResourceNotFoundException", "ValidationException"}:
                raise

    ddb.delete_item(Key={"sessionId": session_id})

    trigger = event.get("reason") if isinstance(event, dict) else None
    if trigger in {"AUTO_TIMEOUT", "EXPIRED_CLEANUP"} and os.environ.get("GRADE_LAB_LAMBDA_ARN"):
        lambda_client.invoke(
            FunctionName=os.environ["GRADE_LAB_LAMBDA_ARN"],
            InvocationType="Event",
            Payload=json.dumps({"sessionId": session_id, "trigger": "ON_LAB_END"}).encode("utf-8"),
        )

    return _response(200, {"sessionId": session_id, "status": "STOPPED"})
