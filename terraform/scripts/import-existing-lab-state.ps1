# Import AWS resources that exist but are missing from Terraform state after a partial apply.
# Run from terraform/:  .\scripts\import-existing-lab-state.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

function Import-Tf($Address, $Id) {
  Write-Host "==> terraform import $Address $Id"
  terraform import $Address $Id
  if ($LASTEXITCODE -ne 0) { throw "import failed: $Address" }
}

# ECR first (other resources reference repo keys in plan graph)
Import-Tf "aws_ecr_repository.lab_base_linux" "vlab-dev-lab-base-linux"
Import-Tf "aws_ecr_repository.lab_base_python" "vlab-dev-lab-base-python"
Import-Tf "aws_ecr_repository.lab_base_java" "vlab-dev-lab-base-java"

$labImages = @(
  "python", "java", "linux", "mysql", "postgres", "oracle", "android", "android-emulator", "bigdata",
  "datascience", "dotnet", "softwareengeering", "testing"
)
foreach ($lab in $labImages) {
  Import-Tf "aws_ecr_repository.lab_images[\`"$lab\`"]" "vlab-dev-$lab"
}

Import-Tf "aws_dynamodb_table.sessions" "vlab-sessions"
Import-Tf "aws_dynamodb_table.submissions" "lab-submissions"
Import-Tf "aws_dynamodb_table.results" "lab-results"
Import-Tf "aws_dynamodb_table.runs" "vlab-runs"

Import-Tf "aws_cloudwatch_log_group.ecs" "/aws/ecs/vlab-dev-lab"
Import-Tf "aws_iam_role.ecs_task_execution" "vlab-dev-ecs-task-execution-role"
Import-Tf "aws_iam_role.ecs_task" "vlab-dev-ecs-task-role"
Import-Tf "aws_iam_role_policy.ecs_task_execute_command" "vlab-dev-ecs-task-role:vlab-dev-ecs-task-exec-policy"
Import-Tf "aws_iam_role_policy_attachment.ecs_task_execution_managed" "vlab-dev-ecs-task-execution-role/arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"

$taskDefs = @(
  "python", "java", "linux", "mysql", "postgres", "oracle", "agilemethodology", "android", "android-emulator", "bigdata",
  "datascience", "dotnet", "softwareengeering", "testing"
)
foreach ($lab in $taskDefs) {
  Import-Tf "aws_ecs_task_definition.lab[\`"$lab\`"]" "vlab-dev-${lab}-task"
}

Write-Host "Done. Run: terraform plan"
