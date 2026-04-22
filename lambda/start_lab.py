import json
import os
import uuid
import base64
from datetime import datetime, timedelta, timezone

import boto3


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
    ecs_cluster_arn = os.environ["ECS_CLUSTER_ARN"]
    task_definition_map = json.loads(os.environ["LAB_TASK_DEFINITION_MAP"])
    ecs_subnet_ids = os.environ["ECS_SUBNET_IDS"].split(",")
    ecs_security_group_id = os.environ["ECS_SECURITY_GROUP_ID"]
    table_name = os.environ["DYNAMODB_TABLE_NAME"]
    stop_lab_lambda_arn = os.environ["STOP_LAB_LAMBDA_ARN"]
    scheduler_role_arn = os.environ["SCHEDULER_ROLE_ARN"]
    scheduler_group_name = os.environ["SCHEDULER_GROUP_NAME"]
    default_timeout = int(os.environ["DEFAULT_SESSION_TIMEOUT"])
    allowed_lab_types = set(os.environ.get("ALLOWED_LAB_TYPES", "").split(","))
    enable_alb = os.environ.get("ENABLE_ALB", "false").lower() == "true"
    alb_dns_name = os.environ.get("ALB_DNS_NAME", "")

    body = _parse_event_body(event)
    user_id = body.get("userId")
    lab_type = body.get("labType")
    try:
        duration_minutes = _to_int(body.get("duration", default_timeout), "duration")
    except ValueError as exc:
        return _response(400, {"error": str(exc)})
    additional_env = body.get("environment", {})

    if not user_id or not lab_type:
        return _response(400, {"error": "userId and labType are required"})
    if lab_type not in allowed_lab_types:
        return _response(400, {"error": f"Unsupported labType: {lab_type}"})
    if duration_minutes <= 0:
        return _response(400, {"error": "duration must be > 0"})
    if lab_type not in task_definition_map:
        return _response(500, {"error": f"No task definition configured for labType: {lab_type}"})

    session_id = str(uuid.uuid4())
    schedule_id = f"stop-{session_id}"
    now_utc = datetime.now(timezone.utc)
    stop_at = now_utc + timedelta(minutes=duration_minutes)
    ttl_epoch = int((stop_at + timedelta(minutes=5)).timestamp())

    ecs_client = boto3.client("ecs", region_name=region)
    ddb = boto3.resource("dynamodb", region_name=region).Table(table_name)
    scheduler = boto3.client("scheduler", region_name=region)

    run_task_response = ecs_client.run_task(
        cluster=ecs_cluster_arn,
        taskDefinition=task_definition_map[lab_type],
        launchType="FARGATE",
        count=1,
        networkConfiguration={
            "awsvpcConfiguration": {
                "subnets": ecs_subnet_ids,
                "securityGroups": [ecs_security_group_id],
                "assignPublicIp": "DISABLED",
            }
        },
        overrides={
            "containerOverrides": [
                {
                    "name": "lab-runtime",
                    "environment": [{"name": "LAB_TYPE", "value": lab_type}]
                    + (
                        [{"name": k, "value": str(v)} for k, v in additional_env.items()]
                        if isinstance(additional_env, dict)
                        else []
                    ),
                }
            ]
        },
        enableExecuteCommand=False,
    )

    failures = run_task_response.get("failures", [])
    if failures:
        return _response(500, {"error": "Failed to start ECS task", "details": failures})

    task_arn = run_task_response["tasks"][0]["taskArn"]

    scheduler.create_schedule(
        Name=schedule_id,
        GroupName=scheduler_group_name,
        ScheduleExpression=f"at({stop_at.strftime('%Y-%m-%dT%H:%M:%S')})",
        ScheduleExpressionTimezone="UTC",
        FlexibleTimeWindow={"Mode": "OFF"},
        Target={
            "Arn": stop_lab_lambda_arn,
            "RoleArn": scheduler_role_arn,
            "Input": json.dumps({"sessionId": session_id, "reason": "AUTO_TIMEOUT"}),
        },
        ActionAfterCompletion="DELETE",
    )

    ddb.put_item(
        Item={
            "sessionId": session_id,
            "userId": user_id,
            "labType": lab_type,
            "taskArn": task_arn,
            "clusterArn": ecs_cluster_arn,
            "scheduleId": schedule_id,
            "startTime": now_utc.isoformat(),
            "expiryTime": ttl_epoch,
            "status": "RUNNING",
        }
    )

    connection_info = {
        "taskArn": task_arn,
        "clusterArn": ecs_cluster_arn,
        "region": region,
    }
    if enable_alb and alb_dns_name:
        connection_info["labEndpoint"] = f"http://{alb_dns_name}"

    return _response(
        200,
        {
            "sessionId": session_id,
            "labType": lab_type,
            "status": "RUNNING",
            "expiresAt": stop_at.isoformat(),
            "connectionInfo": connection_info,
        },
    )
