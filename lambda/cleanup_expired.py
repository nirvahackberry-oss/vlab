import json
import os
from datetime import datetime, timezone

import boto3


def lambda_handler(event, context):
    region = os.environ["AWS_REGION"]
    now_epoch = int(datetime.now(timezone.utc).timestamp())
    table = boto3.resource("dynamodb", region_name=region).Table(os.environ["SESSIONS_TABLE_NAME"])
    lambda_client = boto3.client("lambda", region_name=region)

    scan_resp = table.scan(
        ProjectionExpression="sessionId, expiryTime",
        FilterExpression="expiryTime <= :now",
        ExpressionAttributeValues={":now": now_epoch},
    )
    expired_items = scan_resp.get("Items", [])

    stopped = 0
    for item in expired_items:
        session_id = item.get("sessionId")
        if not session_id:
            continue
        lambda_client.invoke(
            FunctionName=os.environ["STOP_LAB_LAMBDA_ARN"],
            InvocationType="Event",
            Payload=json.dumps({"sessionId": session_id, "reason": "EXPIRED_CLEANUP"}).encode("utf-8"),
        )
        lambda_client.invoke(
            FunctionName=os.environ["GRADE_LAB_LAMBDA_ARN"],
            InvocationType="Event",
            Payload=json.dumps({"sessionId": session_id, "trigger": "ON_LAB_END"}).encode("utf-8"),
        )
        stopped += 1

    return {"statusCode": 200, "body": json.dumps({"expiredSessionsHandled": stopped})}
