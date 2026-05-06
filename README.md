# Ephemeral Multi-Lab on AWS (Terraform + CI/CD)

Production-ready infrastructure for isolated, short-lived multi-lab sessions using ECS Fargate.  
Job-model execution: sessions are metadata only; each **Run click** starts a short-lived Fargate task that executes and exits. Outputs are stored in DynamoDB and polled by `runId`.

## Architecture

```mermaid
flowchart TD
    U[User] -->|GET /labs| APIGW[API Gateway HTTP API]
    U -->|GET /labs/{labId}| APIGW
    U -->|POST /lab-sessions| APIGW
    U -->|GET /lab-sessions/{sessionId}| APIGW
    U -->|POST /lab-sessions/{sessionId}/stop| APIGW
    U -->|POST /runs| APIGW
    U -->|GET /runs/{runId}| APIGW
    U -->|POST /submit| APIGW
    U -->|POST /grade| APIGW
    U -->|GET /result| APIGW
    APIGW --> L1[start-lab Lambda]
    APIGW --> L2[execute-code Lambda]
    APIGW --> LR[get-run Lambda]
    APIGW --> L3[submit-code Lambda]
    APIGW --> L4[grade-lab Lambda]
    APIGW --> L5[stop-lab Lambda]
    APIGW --> L6[get-result Lambda]
    APIGW --> L7[get-labs Lambda]
    APIGW --> L8[get-session Lambda]
    L2 --> ECSRUN[ECS Fargate Run Task]
    L4 --> ECS
    L1 --> SCH[EventBridge Scheduler]
    L1 --> DDB[(DynamoDB vlab-sessions)]
    L3 --> SUB[(DynamoDB submissions)]
    L4 --> RES[(DynamoDB results)]
    ECSRUN -->|task stopped event| PTR[process-task-result Lambda]
    PTR --> RUNS[(DynamoDB runs by runId)]
    SCH -->|timeout| L5
    SCH -->|rate 5 min| CLN[cleanup-expired Lambda]
    CLN --> L5
    CLN --> L4
    L5 --> DDB
    L5 --> SCH
    L5 --> DDB
    L4 --> S3[(S3 test cases)]
    DDB -->|TTL expiryTime| TTL[Automatic metadata cleanup]
    ECS --> ECR[ECR prebuilt image]
    ECSRUN --> CWL[CloudWatch Logs]
```

## Resource Coverage

- ECR repositories per lab type (`python`, `java`, `linux`, `dbms`)
- VPC with private subnets, optional NAT Gateway
- Security groups and VPC endpoints for ECR/CloudWatch/S3 access
- ECS cluster + Fargate task definition with ephemeral storage
- Lambda functions for full lab lifecycle
- API Gateway HTTP API routes:
  - `GET /labs`
  - `GET /labs/{labId}`
  - `POST /lab-sessions`
  - `GET /lab-sessions/{sessionId}`
  - `POST /lab-sessions/{sessionId}/stop`
  - `POST /runs`
  - `GET /runs/{runId}`
  - `POST /submit`
  - `POST /grade`
  - `GET /result`
- EventBridge Scheduler schedule group (one-time stop schedules per session)
- EventBridge recurring schedule (cleanup-expired, every 5 minutes)
- DynamoDB tables:
  - `vlab-sessions` (TTL: `expiryTime`)
  - `lab-submissions`
  - `lab-results` (TTL: `expiryTime`)
  - `vlab-runs` (TTL: `expiryTime`, PK: `runId`, GSI: `bySession`)
- S3 bucket for grading test cases
- IAM roles/policies with scoped permissions
- CloudWatch logs for ECS, Lambda, API Gateway
- Optional S3 temp data bucket

## Project Layout

```text
terraform/
  main.tf
  variables.tf
  outputs.tf
  vpc.tf
  ecs.tf
  lambda.tf
  api_gateway.tf
  iam.tf
  dynamodb.tf
  eventbridge.tf
  ecr.tf
  security_groups.tf
  backend_resources.tf
lambda/
  start_lab.py
  stop_lab.py
  execute_code.py
  submit_code.py
  grade_lab.py
  cleanup_expired.py
  get_result.py
  get_session.py
  get_labs.py
  process_task_result.py
.github/workflows/
  deploy.yml
lab-images/
  python/Dockerfile
  java/Dockerfile
  linux/Dockerfile
  dbms/Dockerfile
```
 
> Runtime images are defined per lab type under `lab-images/<type>/Dockerfile`. In job-model mode, images do not need to expose HTTP ports.

## Runtime Flow

1. Client calls `GET /labs` or `GET /labs/{labId}` to browse available labs.
2. Client calls `POST /lab-sessions` with `userId`, `labId`, and optional `duration`.
3. `start-lab` Lambda validates `labId` and stores a session record in DynamoDB (`sessionId`, `userId`, `labId`, `labType`, `startTime`, `expiryTime`).
4. Client can call `GET /lab-sessions/{sessionId}` to check if the session is `running` or `expired`.
5. Student clicks **Run** and calls `POST /runs` with `sessionId`, `labType/labId`, and `code`.
6. `execute-code` Lambda creates a `runId`, writes `status=QUEUED` to DynamoDB `vlab-runs`, and launches a short-lived Fargate task that executes the code.
7. When the ECS task stops, EventBridge triggers `process-task-result` Lambda, which parses CloudWatch logs and writes the final output/errors to DynamoDB `vlab-runs` keyed by `runId`.
8. Client polls `GET /runs/{runId}` until `status` is `COMPLETED` or `FAILED`.
9. Student calls `POST /submit` to persist the submission; grading is triggered synchronously via `grade-lab` Lambda.
10. `GET /result?sessionId=<id>` returns the grading result from `lab-results`.
11. Timeout or manual `POST /lab-sessions/{sessionId}/stop` calls `stop-lab`.
12. `stop-lab` deletes the DynamoDB session record (job-model runs are already short-lived tasks).
13. A recurring EventBridge schedule (every 5 minutes) invokes `cleanup-expired`, which scans for sessions past their `expiryTime` and invokes `stop-lab`.
14. DynamoDB TTL acts as a final backup metadata cleanup.

## Prerequisites

- Terraform `>= 1.6`
- AWS account + IAM role for GitHub OIDC
- GitHub repository secrets:
  - `AWS_GITHUB_ACTIONS_ROLE_ARN`

## Local Deploy (Terraform CLI)

```bash
cd terraform
terraform init
terraform plan -out tfplan
terraform apply tfplan
```

Optional destroy:

```bash
terraform destroy
```

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/deploy.yml`

Triggers on push to `main` (changes to `terraform/`, `lambda/`, `lab-images/`, `lab_server.py`) or `workflow_dispatch`.

Jobs:
1. `build-and-push` — builds and pushes all four lab images to ECR (`python`, `java`, `linux`, `dbms`)
2. `terraform-plan` — runs `init`, `fmt -check`, `validate`, `plan`
3. `terraform-apply` — runs on `workflow_dispatch` with `apply=true`
4. `terraform-destroy` — runs on `workflow_dispatch` with `destroy=true`

For manual approval on apply, configure GitHub **Environment** `dev` with required reviewers.

## API Contracts

### `GET /labs`

Response:

```json
{
  "success": true,
  "labs": [
    {
      "id": "python",
      "title": "Python for Data Science",
      "complexity": "Beginner",
      "durationMinutes": 60,
      "credits": 20,
      "status": "ready"
    }
  ]
}
```

### `GET /labs/{labId}`

Response:

```json
{
  "success": true,
  "lab": { "id": "python", "title": "Python for Data Science", "..." : "..." }
}
```

### `POST /lab-sessions`

Request body:

```json
{
  "userId": "user-123",
  "labId": "python",
  "duration": 45,
  "environment": {
    "LAB_TOPIC": "loops"
  }
}
```

Response:

```json
{
  "success": true,
  "sessionId": "sess_a1b2c3d4",
  "labId": "python",
  "status": "running",
  "message": "Lab session started",
  "estimatedReadyInSeconds": 0
}
```

### `GET /lab-sessions/{sessionId}`

Response (while starting):

```json
{
  "success": true,
  "sessionId": "sess_a1b2c3d4",
  "labId": "python",
  "status": "starting",
  "estimatedReadyInSeconds": 30
}
```

Response (when running):

```json
{
  "success": true,
  "sessionId": "sess_a1b2c3d4",
  "labId": "python",
  "status": "running",
  "startedAt": "2026-04-22T11:00:00+00:00",
  "expiresAt": 1745319600,
  "estimatedReadyInSeconds": 0,
  "credentials": {
    "username": "student",
    "password": "provided-in-lab",
    "accountId": "123456789012"
  },
  "tools": {
    "terminal": { "enabled": true, "url": "https://terminal.lab.example.com/sess_a1b2c3d4" },
    "ide": { "enabled": true, "url": "https://ide.lab.example.com/sess_a1b2c3d4" }
  }
}
```

### `POST /lab-sessions/{sessionId}/stop`

Response:

```json
{
  "sessionId": "sess_a1b2c3d4",
  "status": "STOPPED"
}
```

Idempotent: returns success when session is already removed.

### `POST /runs`

Request body:

```json
{
  "sessionId": "sess_a1b2c3d4",
  "labType": "python",
  "code": "print('hello')"
}
```

Response (immediate):

```json
{
  "success": true,
  "runId": "run_1a2b3c4d5e6f",
  "status": "STARTED"
}
```

Supported `labType` values: `python`, `java`, `linux`, `dbms`.

### `GET /runs/{runId}`

Response (not ready yet):

```json
{
  "status": "PROCESSING",
  "runId": "run_1a2b3c4d5e6f",
  "message": "Result not ready yet"
}
```

Response (ready):

```json
{
  "runId": "run_1a2b3c4d5e6f",
  "sessionId": "sess_a1b2c3d4",
  "labType": "python",
  "status": "COMPLETED",
  "success": true,
  "output": "hello",
  "syntaxError": "",
  "runtimeError": ""
}
```

### Frontend polling example (finish output, no streaming)

```js
// 1) Start a run
const start = await fetch(`${API_BASE}/runs`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sessionId, labType: "python", code }),
}).then(r => r.json());

// 2) Poll until completed
let run;
for (;;) {
  run = await fetch(`${API_BASE}/runs/${start.runId}`).then(r => r.json());
  if (run.status === "COMPLETED" || run.status === "FAILED") break;
  await new Promise(r => setTimeout(r, 800));
}

// 3) Show output/errors
console.log(run.output);
console.error(run.syntaxError || run.runtimeError);
```

### `POST /submit`

Request body:

```json
{
  "sessionId": "sess_a1b2c3d4",
  "code": "print('hello')",
  "triggerGrade": true
}
```

Response:

```json
{
  "saved": true,
  "sessionId": "sess_a1b2c3d4",
  "gradeResult": { "score": 1, "maxScore": 1, "passed": true, "feedback": "..." }
}
```

### `POST /grade`

Request body:

```json
{ "sessionId": "sess_a1b2c3d4" }
```

Response:

```json
{
  "sessionId": "sess_a1b2c3d4",
  "userId": "user-123",
  "score": 3,
  "maxScore": 4,
  "passed": false,
  "feedback": "Partial score assigned by baseline grader scaffold.",
  "gradedAt": "2026-04-22T11:30:00+00:00"
}
```

### `GET /result?sessionId={sessionId}`

Response (ready):

```json
{
  "sessionId": "sess_a1b2c3d4",
  "score": 3,
  "maxScore": 4,
  "passed": false,
  "status": "COMPLETED",
  "gradedAt": "2026-04-22T11:30:00+00:00"
}
```

Response (not yet ready):

```json
{
  "status": "PROCESSING",
  "message": "Result not ready yet"
}
```

## Security Notes

- Least-privilege IAM policies for Lambda, Scheduler, ECS
- Lab tasks run in private subnets without public IP
- API Gateway currently uses `authorization_type = NONE` as a placeholder
- Add JWT/Lambda authorizer before public exposure
- Consider WAF, KMS CMKs, and tighter egress controls for stricter environments

## Key Terraform Variables

| Variable | Default | Description |
|---|---|---|
| `region` | `ap-south-1` | AWS region |
| `project_name` | `vlab` | Resource name prefix |
| `environment` | `dev` | Deployment environment |
| `lab_types` | `["python","java","linux","dbms"]` | Supported lab types |
| `lab_cpu` | `512` | Default ECS task CPU units |
| `lab_memory` | `1024` | Default ECS task memory (MiB) |
| `lab_cpu_by_type` | `{}` | Per-type CPU overrides |
| `lab_memory_by_type` | `{}` | Per-type memory overrides |
| `session_timeout_minutes` | `60` | Default session duration |
| `ephemeral_storage_gib` | `30` | Fargate ephemeral storage (GiB) |
| `enable_nat_gateway` | `false` | Enable NAT Gateway |
| `enable_alb` | `false` | Enable ALB |
| `enable_temp_data_bucket` | `false` | Enable temp S3 bucket |
| `dynamodb_table_name` | `vlab-sessions` | Sessions table name |
| `submissions_table_name` | `lab-submissions` | Submissions table name |
| `results_table_name` | `lab-results` | Results table name |
| `runs_table_name` | `vlab-runs` | Runs table name (per-run output) |

Example per-lab sizing:

```hcl
lab_cpu_by_type = {
  python = 512
  java   = 1024
  linux  = 512
  dbms   = 1024
}

lab_memory_by_type = {
  python = 1024
  java   = 2048
  linux  = 1024
  dbms   = 3072
}
```

## Outputs

- `api_gateway_url` — HTTP API invoke URL
- `ecr_repository_urls` — ECR repository URLs by lab type
- `ecs_cluster_name` — ECS cluster name
- `ecs_task_definition_arns` — Task definition ARNs by lab type
- `lambda_arns` — ARNs for all Lambda functions
- `dynamodb_tables` — Names of sessions, submissions, and results tables
- `test_cases_bucket` — S3 bucket for grading test cases
- `alb_dns_name` — Optional ALB DNS name
