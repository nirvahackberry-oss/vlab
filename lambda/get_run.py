import json
import os
from decimal import Decimal

import boto3


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)


def lambda_handler(event, context):
    # Accept REST path: /runs/{runId}
    run_id = (event.get("pathParameters") or {}).get("runId")
    if not run_id:
        # Fallback: query string (?runId=)
        params = event.get("queryStringParameters") or {}
        run_id = params.get("runId")
    if not run_id:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "runId is required"}),
        }

    region = os.environ["AWS_REGION"]
    table = boto3.resource("dynamodb", region_name=region).Table(os.environ["RUNS_TABLE_NAME"])
    item = table.get_item(Key={"runId": run_id}).get("Item")
    if not item:
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"status": "PROCESSING", "runId": run_id, "message": "Result not ready yet"}),
        }

    # Normalize status
    if "status" not in item:
        item["status"] = "COMPLETED"
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(item, cls=DecimalEncoder),
    }

