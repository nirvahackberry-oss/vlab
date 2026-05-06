import json
import os
from datetime import datetime, timezone

import boto3

dynamodb = boto3.resource("dynamodb")

def lambda_handler(event, context):
    table_name = os.environ.get('DYNAMODB_TABLE_NAME')
    table = dynamodb.Table(table_name)
    region = os.environ.get("AWS_REGION")
    ecs_cluster_arn = os.environ.get("ECS_CLUSTER_ARN", "")
    ecs = boto3.client("ecs", region_name=region) if region and ecs_cluster_arn else None
    
    path_parameters = event.get('pathParameters')
    if not path_parameters or 'sessionId' not in path_parameters:
        return {
            "statusCode": 400,
            "body": json.dumps({"success": False, "message": "Missing sessionId"})
        }
    
    session_id = path_parameters['sessionId']
    
    try:
        response = table.get_item(Key={'sessionId': session_id})
        item = response.get('Item')
        
        if not item:
            return {
                "statusCode": 404,
                "body": json.dumps({"success": False, "message": "Session not found"})
            }
            
        status = item.get("status", "running")
        expiry = item.get("expiryTime")
        now_epoch = int(datetime.now(timezone.utc).timestamp())
        if isinstance(expiry, (int, float)) and now_epoch >= int(expiry):
            status = "expired"

        # Warm-session bootstrap: if the session is still "starting", try to resolve the task ENI IP.
        if status == "starting" and ecs and item.get("taskArn") and not (item.get("taskPrivateIp") or "").strip():
            try:
                desc = ecs.describe_tasks(cluster=ecs_cluster_arn, tasks=[item["taskArn"]])
                tasks = desc.get("tasks") or []
                if tasks:
                    t = tasks[0]
                    private_ip = ""
                    for att in t.get("attachments") or []:
                        if att.get("type") != "ElasticNetworkInterface":
                            continue
                        for d in att.get("details") or []:
                            if d.get("name") == "privateIPv4Address":
                                private_ip = d.get("value") or ""
                                break
                        if private_ip:
                            break
                    if private_ip:
                        table.update_item(
                            Key={"sessionId": session_id},
                            UpdateExpression="SET #s = :s, taskPrivateIp = :ip, taskPort = :p",
                            ExpressionAttributeNames={"#s": "status"},
                            ExpressionAttributeValues={":s": "running", ":ip": private_ip, ":p": 8080},
                        )
                        item["taskPrivateIp"] = private_ip
                        item["taskPort"] = 8080
                        status = "running"
                    elif t.get("lastStatus") == "STOPPED":
                        status = "failed"
            except Exception as e:
                print("Failed to resolve task IP:", str(e))

        # Build response matching frontend spec
        result = {
            "success": True,
            "sessionId": session_id,
            "labId": item.get('labId'),
            "status": status,
            "message": "Lab session status retrieved",
            "estimatedReadyInSeconds": 0 if status == 'running' else 30,
        }
        
        if status == 'running':
            result.update({
                "startedAt": item.get('startTime'),
                "expiresAt": item.get('expiryTime'),
                "credentials": {
                    "username": "student",
                    "password": "provided-in-lab",
                    "accountId": os.environ.get('AWS_ACCOUNT_ID', '123456789012')
                },
                "tools": {
                    "terminal": {
                        "enabled": True,
                        "url": f"https://terminal.lab.ignito.com/{session_id}"
                    },
                    "ide": {
                        "enabled": True,
                        "url": f"https://ide.lab.ignito.com/{session_id}"
                    }
                }
            })
            
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(result)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"success": False, "message": str(e)})
        }
