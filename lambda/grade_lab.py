import json
import os
from datetime import datetime, timezone

import boto3

_LAB_ID_ALIASES = {
    "python-lab": "python",
    "java-lab": "java",
    "linux-lab": "linux",
    "dbms-lab": "dbms",
    "agilemethodology-lab": "agilemethodology",
    "android-lab": "android",
    "bigdata-lab": "bigdata",
    "datascience-lab": "datascience",
    "dotnet-lab": "dotnet",
    "softwareengeering-lab": "softwareengeering",
    "testing-lab": "testing",
}


def _canonical_lab_type(lab_id: str) -> str:
    if not lab_id:
        return lab_id
    return _LAB_ID_ALIASES.get(lab_id, lab_id)


def _parse_event(event):
    if isinstance(event, dict) and "body" in event:
        body = event["body"]
        return body if isinstance(body, dict) else json.loads(body or "{}")
    return event if isinstance(event, dict) else {}


def lambda_handler(event, context):
    payload = _parse_event(event)
    session_id = payload.get("sessionId")
    run_id = payload.get("runId") or ""
    if not session_id:
        return {"statusCode": 400, "body": json.dumps({"error": "sessionId is required"})}

    region = os.environ["AWS_REGION"]
    ddb = boto3.resource("dynamodb", region_name=region)
    s3 = boto3.client("s3", region_name=region)
    submissions = ddb.Table(os.environ["SUBMISSIONS_TABLE_NAME"])
    results = ddb.Table(os.environ["RESULTS_TABLE_NAME"])
    sessions = ddb.Table(os.environ["SESSIONS_TABLE_NAME"])
    runs_table_name = os.environ.get("RUNS_TABLE_NAME", "").strip()
    runs = ddb.Table(runs_table_name) if runs_table_name else None

    sub = submissions.get_item(Key={"sessionId": session_id}).get("Item")
    sess = sessions.get_item(Key={"sessionId": session_id}).get("Item")
    if not sub or not sess:
        return {"statusCode": 404, "body": json.dumps({"error": "Submission or session not found"})}

    lab_type = (
        sub.get("labType")
        or sess.get("labType")
        or _canonical_lab_type(sess.get("labId", ""))
        or "python"
    )
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

    # Optional: if invoked for runMode=grade, attach grade summary to the run record.
    if run_id and runs:
        try:
            runs.update_item(
                Key={"runId": run_id},
                UpdateExpression="SET gradeScore = :s, gradeMaxScore = :m, gradePassed = :p, gradeFeedback = :f, gradeAt = :t",
                ExpressionAttributeValues={
                    ":s": score,
                    ":m": max_score,
                    ":p": passed,
                    ":f": result_item["feedback"],
                    ":t": result_item["gradedAt"],
                },
            )
        except Exception as e:
            # Do not fail grading result due to run annotation issues.
            print("Failed to update run grade fields:", str(e))

    return {"statusCode": 200, "body": json.dumps(result_item)}
