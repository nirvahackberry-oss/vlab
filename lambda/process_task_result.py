import json
import os
import time
import boto3

def _read_logs(logs_client, log_group: str, log_stream: str, retries: int = 5) -> str:
    for _ in range(retries):
        try:
            resp = logs_client.get_log_events(
                logGroupName=log_group,
                logStreamName=log_stream,
                startFromHead=True,
            )
            return "\n".join(e["message"] for e in resp.get("events", []))
        except logs_client.exceptions.ResourceNotFoundException:
            time.sleep(2)
    return ""

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))
    
    detail = event.get("detail", {})
    last_status = detail.get("lastStatus")
    task_arn = detail.get("taskArn")
    cluster_arn = detail.get("clusterArn")
    
    if last_status != "STOPPED":
        print(f"Task {task_arn} is not stopped. Status: {last_status}")
        return

    # Extract session ID from environment overrides
    session_id = None
    container_overrides = detail.get("overrides", {}).get("containerOverrides", [])
    for container in container_overrides:
        env = container.get("environment", [])
        for pair in env:
            if pair.get("name") == "SESSION_ID":
                session_id = pair.get("value")
                break
        if session_id:
            break
            
    if not session_id:
        print(f"No SESSION_ID found in overrides for task {task_arn}. Ignoring.")
        return

    # Get logs
    task_id = task_arn.split("/")[-1]
    log_group_name = os.environ["LAB_LOG_GROUP_NAME"]
    log_stream = f"ecs/lab-runtime/{task_id}"
    
    region = os.environ["AWS_REGION"]
    logs = boto3.client("logs", region_name=region)
    output = _read_logs(logs, log_group_name, log_stream)
    
    # Determine success
    exit_code = 1
    containers = detail.get("containers", [])
    if containers:
        exit_code = containers[0].get("exitCode", 1)
        
    success = (exit_code == 0)
    
    # Extract Lab Type to help with error parsing
    lab_type = "unknown"
    for container in container_overrides:
        env = container.get("environment", [])
        for pair in env:
            if pair.get("name") == "LAB_TYPE":
                lab_type = pair.get("value")
                break

    syntax_error = ""
    runtime_error = ""
    
    if not success:
        out_lower = output.lower()
        # More specific error parsing
        if lab_type == "python":
            if "syntaxerror" in out_lower or "indentationerror" in out_lower:
                syntax_error = output
            else:
                runtime_error = output
        elif lab_type == "java":
            if "error:" in out_lower and "javac" in detail.get("overrides", {}).get("containerOverrides", [{}])[0].get("command", [""])[-1]:
                syntax_error = output
            else:
                runtime_error = output
        else:
            # Fallback for linux/dbms
            syntax_error = output if any(t in out_lower for t in ["syntax", "compile"]) else ""
            runtime_error = "" if syntax_error else output

    # Save to DynamoDB with TTL (2 hours)
    table_name = os.environ["RESULTS_TABLE_NAME"]
    ddb = boto3.resource("dynamodb", region_name=region).Table(table_name)
    
    # TTL is epoch time in seconds
    expiry_time = int(time.time()) + (2 * 3600)
    
    result_item = {
        "sessionId": session_id,
        "taskId": task_id,
        "success": success,
        "output": output,
        "syntaxError": syntax_error,
        "runtimeError": runtime_error,
        "labType": lab_type,
        "timestamp": detail.get("stoppedAt", detail.get("updatedAt", "")),
        "expiryTime": expiry_time
    }
    
    ddb.put_item(Item=result_item)
    print(f"Saved result for session {session_id} to {table_name} with TTL")
    
    return {"status": "success"}
