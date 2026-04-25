import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
ecs = boto3.client('ecs')

def lambda_handler(event, context):
    table_name = os.environ.get('DYNAMODB_TABLE_NAME')
    table = dynamodb.Table(table_name)
    
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
            
        status = item.get('status', 'pending')
        
        # If the lab is marked as starting, check ECS for the actual status
        if status == 'starting' or status == 'pending':
            task_arn = item.get('taskArn')
            cluster_arn = os.environ.get('ECS_CLUSTER_ARN')
            
            if task_arn:
                task_resp = ecs.describe_tasks(cluster=cluster_arn, tasks=[task_arn])
                tasks = task_resp.get('tasks', [])
                if tasks:
                    task = tasks[0]
                    last_status = task.get('lastStatus')
                    
                    if last_status == 'RUNNING':
                        status = 'running'
                        # Get the IP address (this assumes public IP for now, adjust based on network mode)
                        # For production, you might return an ALB URL or a proxy URL
                        eni_id = ""
                        for attachment in task.get('attachments', []):
                            for detail in attachment.get('details', []):
                                if detail.get('name') == 'networkInterfaceId':
                                    eni_id = detail.get('value')
                        
                        # In this lab env, we return a mock tool URL or the task ID
                        # In a real setup, we'd query EC2 for the Public IP of that ENI.
                        item['status'] = 'running'
                        table.update_item(
                            Key={'sessionId': session_id},
                            UpdateExpression="SET #s = :s",
                            ExpressionAttributeNames={"#s": "status"},
                            ExpressionAttributeValues={":s": "running"}
                        )

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
