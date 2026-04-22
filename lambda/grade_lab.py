import json
import os
from datetime import datetime, timezone

import boto3


def _parse_event(event):
    if isinstance(event, dict) and "body" in event:
        body = event["body"]
        return body if isinstance(body, dict) else json.loads(body or "{}")
    return event if isinstance(event, dict) else {}


def lambda_handler(event, context):
    payload = _parse_event(event)
    session_id = payload.get("sessionId")
    if not session_id:
        return {"statusCode": 400, "body": json.dumps({"error": "sessionId is required"})}

    region = os.environ["AWS_REGION"]
    ddb = boto3.resource("dynamodb", region_name=region)
    s3 = boto3.client("s3", region_name=region)
    submissions = ddb.Table(os.environ["SUBMISSIONS_TABLE_NAME"])
    results = ddb.Table(os.environ["RESULTS_TABLE_NAME"])
    sessions = ddb.Table(os.environ["SESSIONS_TABLE_NAME"])

    sub = submissions.get_item(Key={"sessionId": session_id}).get("Item")
    sess = sessions.get_item(Key={"sessionId": session_id}).get("Item")
    if not sub or not sess:
        return {"statusCode": 404, "body": json.dumps({"error": "Submission or session not found"})}

    lab_type = sub.get("labType", sess.get("labType", "python"))
    user_id = sub.get("userId", sess.get("userId", "unknown"))

    bucket = os.environ["TEST_CASES_BUCKET"]
    prefix = f"{lab_type}/"
    objects = s3.list_objects_v2(Bucket=bucket, Prefix=prefix).get("Contents", [])
    expected_files = sorted([o["Key"] for o in objects if o["Key"].endswith("expected.txt")])

    max_score = len(expected_files) if expected_files else 1
    score = 0
    feedback = []

    # Lightweight grader scaffold: compares code non-empty and counts available tests.
    if sub.get("code", "").strip():
        if expected_files:
            score = max(1, len(expected_files) // 2)
            feedback.append("Partial score assigned by baseline grader scaffold.")
        else:
            score = 1
            feedback.append("No test cases found; default pass for non-empty submission.")
    else:
        feedback.append("Submission code is empty.")

    passed = score == max_score
    result_item = {
        "sessionId": session_id,
        "userId": user_id,
        "score": score,
        "maxScore": max_score,
        "passed": passed,
        "feedback": " ".join(feedback),
        "gradedAt": datetime.now(timezone.utc).isoformat(),
    }
    results.put_item(Item=result_item)

    return {"statusCode": 200, "body": json.dumps(result_item)}
