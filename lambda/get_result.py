import json
import os
from decimal import Decimal

import boto3


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    params = event.get("queryStringParameters") or {}
    session_id = params.get("sessionId")
    if not session_id:
        return {"statusCode": 400, "body": json.dumps({"error": "sessionId query parameter is required"})}

    region = os.environ["AWS_REGION"]
    table = boto3.resource("dynamodb", region_name=region).Table(os.environ["RESULTS_TABLE_NAME"])
    item = table.get_item(Key={"sessionId": session_id}).get("Item")
    if not item:
        return {
            "statusCode": 200, 
            "body": json.dumps({"status": "PROCESSING", "message": "Result not ready yet"})
        }

    # Add a success status for consistency
    item["status"] = "COMPLETED"
    return {"statusCode": 200, "body": json.dumps(item, cls=DecimalEncoder)}
