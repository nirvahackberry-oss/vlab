import json
import os
import time

import boto3


def _response(success: bool, syntax_error: str = "", runtime_error: str = "", output: str = ""):
    return {
        "statusCode": 200 if success else 400,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(
            {
                "success": success,
                "syntaxError": syntax_error,
                "runtimeError": runtime_error,
                "output": output,
            }
        ),
    }


def _parse_body(event: dict) -> dict:
    body = event.get("body", "{}")
    if isinstance(body, dict):
        return body
    return json.loads(body)


def _lab_commands(lab_type: str):
    mapping = {
        "python": ("main.py", "python -m py_compile main.py && python main.py"),
        "java":   ("Main.java", "javac Main.java && java Main"),
        "linux":  ("script.sh", "bash -n script.sh && bash script.sh"),
        "dbms":   ("query.sql", "psql -U student -d labdb -f query.sql"),
    }
    return mapping.get(lab_type)


def _wait_task_running(ecs_client, cluster_arn: str, task_arn: str, timeout: int = 120):
    deadline = time.time() + timeout
    while time.time() < deadline:
        resp = ecs_client.describe_tasks(cluster=cluster_arn, tasks=[task_arn])
        tasks = resp.get("tasks", [])
        if not tasks:
            time.sleep(3)
            continue
        status = tasks[0].get("lastStatus")
        if status == "STOPPED":
            return tasks[0]
        if status == "RUNNING":
            return tasks[0]
        time.sleep(3)
    return None


def _wait_task_stopped(ecs_client, cluster_arn: str, task_arn: str, timeout: int = 60):
    deadline = time.time() + timeout
    while time.time() < deadline:
        resp = ecs_client.describe_tasks(cluster=cluster_arn, tasks=[task_arn])
        tasks = resp.get("tasks", [])
        if tasks and tasks[0].get("lastStatus") == "STOPPED":
            return tasks[0]
        time.sleep(2)
    return None


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
    body = _parse_body(event)
    session_id = body.get("sessionId")
    lab_type = body.get("labType")
    code = body.get("code", "")

    if not session_id or not lab_type:
        return _response(False, runtime_error="sessionId and labType are required")

    lab_cmd = _lab_commands(lab_type)
    if not lab_cmd:
        return _response(False, runtime_error=f"Unsupported labType: {lab_type}")

    filename, run_cmd = lab_cmd
    region = os.environ["AWS_REGION"]
    cluster_arn = os.environ["ECS_CLUSTER_ARN"]
    task_definition_map = json.loads(os.environ["LAB_TASK_DEFINITION_MAP"])
    subnet_ids = os.environ["ECS_SUBNET_IDS"].split(",")
    security_group_id = os.environ["ECS_SECURITY_GROUP_ID"]
    log_group_name = os.environ["LAB_LOG_GROUP_NAME"]

    if lab_type not in task_definition_map:
        return _response(False, runtime_error=f"No task definition for labType: {lab_type}")

    # Write code to file then run — single shell string avoids heredoc quoting issues
    escaped = code.replace("'", "'\\''")
    shell_cmd = f"printf '%s' '{escaped}' > /workspace/{filename} && cd /workspace && {run_cmd}"

    ecs = boto3.client("ecs", region_name=region)
    logs = boto3.client("logs", region_name=region)

    run_resp = ecs.run_task(
        cluster=cluster_arn,
        taskDefinition=task_definition_map[lab_type],
        launchType="FARGATE",
        count=1,
        networkConfiguration={
            "awsvpcConfiguration": {
                "subnets": subnet_ids,
                "securityGroups": [security_group_id],
                "assignPublicIp": "DISABLED",
            }
        },
        overrides={
            "containerOverrides": [
                {
                    "name": "lab-runtime",
                    "command": ["bash", "-c", shell_cmd],
                    "environment": [
                        {"name": "LAB_TYPE", "value": lab_type},
                        {"name": "SESSION_ID", "value": session_id},
                    ],
                }
            ]
        },
    )

    failures = run_resp.get("failures")
    if failures:
        return _response(False, runtime_error=json.dumps(failures))

    # Clear previous results to avoid stale data during polling
    results_table = os.environ["RESULTS_TABLE_NAME"]
    ddb = boto3.resource("dynamodb", region_name=region).Table(results_table)
    ddb.delete_item(Key={"sessionId": session_id})

    task_arn = run_resp["tasks"][0]["taskArn"]
    task_id = task_arn.split("/")[-1]

    task = _wait_task_stopped(ecs, cluster_arn, task_arn, timeout=90)
    if not task:
        ecs.stop_task(cluster=cluster_arn, task=task_arn, reason="Lambda timeout")
        return _response(False, runtime_error="Execution timed out")

    # CloudWatch stream: ecs/{container-name}/{task-id}
    log_stream = f"ecs/lab-runtime/{task_id}"
    output = _read_logs(logs, log_group_name, log_stream)

    exit_code = task.get("containers", [{}])[0].get("exitCode", 1)
    if exit_code == 0:
        return _response(True, output=output)

    syntax_error = output if any(t in output.lower() for t in ["syntaxerror", "compile", "javac", "py_compile"]) else ""
    runtime_error = "" if syntax_error else output
    return _response(False, syntax_error=syntax_error, runtime_error=runtime_error, output=output)
