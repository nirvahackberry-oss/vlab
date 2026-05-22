# Node.js API router + JWT authorizer (replaces per-route Python API Lambdas on API Gateway)

resource "random_password" "jwt_secret" {
  count   = var.jwt_secret == "" ? 1 : 0
  length  = 48
  special = false
}

locals {
  node_lambda_env = {
    NODE_ENV                = "production"
    JWT_SECRET              = local.effective_jwt_secret
    JWT_EXPIRES_IN          = var.jwt_expires_in
    SESSIONS_TABLE_NAME     = aws_dynamodb_table.sessions.name
    RUNS_TABLE_NAME         = aws_dynamodb_table.runs.name
    SUBMISSIONS_TABLE_NAME  = aws_dynamodb_table.submissions.name
    RESULTS_TABLE_NAME      = aws_dynamodb_table.results.name
    DYNAMODB_TABLE_NAME     = aws_dynamodb_table.sessions.name
    ECS_CLUSTER             = aws_ecs_cluster.lab.name
    ECS_SUBNETS             = join(",", aws_subnet.private[*].id)
    ECS_SECURITY_GROUPS     = aws_security_group.ecs_tasks.id
    AWS_REGION              = var.region
    CONTAINER_HOST_MODE     = "private"
    DEFAULT_SESSION_TIMEOUT = tostring(var.session_timeout_minutes)
  }
}

resource "null_resource" "node_lambdas_package" {
  count = var.use_node_api_gateway ? 1 : 0

  triggers = {
    package_json = filesha256("${path.module}/../../backend/package.json")
    lambda_js    = filesha256("${path.module}/../../backend/lambda.js")
    authorizer   = filesha256("${path.module}/../../backend/authorizer.js")
  }

  provisioner "local-exec" {
    command     = "bash ${path.module}/../scripts/package-node-lambdas.sh"
    interpreter = ["bash", "-c"]
  }
}

locals {
  node_lambdas_zip_path = "${path.module}/dist/node-lambdas.zip"
  node_lambdas_zip_hash = fileexists(local.node_lambdas_zip_path) ? filebase64sha256(local.node_lambdas_zip_path) : null
}

resource "aws_cloudwatch_log_group" "node_api_lambda" {
  name              = "/aws/lambda/${local.name_prefix}-node-api"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "jwt_authorizer_lambda" {
  name              = "/aws/lambda/${local.name_prefix}-jwt-authorizer"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_iam_role" "node_api_lambda" {
  name               = "${local.name_prefix}-node-api-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy" "node_api_lambda" {
  name   = "${local.name_prefix}-node-api-policy"
  role   = aws_iam_role.node_api_lambda.id
  policy = data.aws_iam_policy_document.node_api_lambda.json
}

resource "aws_iam_role_policy_attachment" "node_api_lambda_vpc" {
  role       = aws_iam_role.node_api_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role" "jwt_authorizer_lambda" {
  name               = "${local.name_prefix}-jwt-authorizer-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "jwt_authorizer_lambda" {
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "jwt_authorizer_lambda" {
  name   = "${local.name_prefix}-jwt-authorizer-policy"
  role   = aws_iam_role.jwt_authorizer_lambda.id
  policy = data.aws_iam_policy_document.jwt_authorizer_lambda.json
}

data "aws_iam_policy_document" "node_api_lambda" {
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "VpcNetworking"
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:AssignPrivateIpAddresses",
      "ec2:UnassignPrivateIpAddresses"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "EcsLabTasks"
    effect = "Allow"
    actions = [
      "ecs:RunTask",
      "ecs:StopTask",
      "ecs:DescribeTasks"
    ]
    resources = ["*"]
  }

  statement {
    sid     = "PassEcsRoles"
    effect  = "Allow"
    actions = ["iam:PassRole"]
    resources = [
      aws_iam_role.ecs_task_execution.arn,
      aws_iam_role.ecs_task.arn
    ]
  }

  statement {
    sid    = "DynamoAccess"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Scan",
      "dynamodb:Query"
    ]
    resources = [
      aws_dynamodb_table.sessions.arn,
      "${aws_dynamodb_table.sessions.arn}/index/*",
      aws_dynamodb_table.runs.arn,
      "${aws_dynamodb_table.runs.arn}/index/*",
      aws_dynamodb_table.submissions.arn,
      aws_dynamodb_table.results.arn
    ]
  }
}

resource "aws_lambda_function" "node_api" {
  count = var.use_node_api_gateway ? 1 : 0

  depends_on = [null_resource.node_lambdas_package]

  function_name    = "${local.name_prefix}-node-api"
  role             = aws_iam_role.node_api_lambda.arn
  runtime          = "nodejs20.x"
  handler          = "lambda.handler"
  filename         = local.node_lambdas_zip_path
  source_code_hash = try(local.node_lambdas_zip_hash, "pending-package")
  timeout          = 120
  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = local.node_lambda_env
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "jwt_authorizer" {
  count = var.use_node_api_gateway ? 1 : 0

  depends_on = [null_resource.node_lambdas_package]

  function_name    = "${local.name_prefix}-jwt-authorizer"
  role             = aws_iam_role.jwt_authorizer_lambda.arn
  runtime          = "nodejs20.x"
  handler          = "authorizer.handler"
  filename         = local.node_lambdas_zip_path
  source_code_hash = try(local.node_lambdas_zip_hash, "pending-package")
  timeout          = 10
  memory_size      = 256

  environment {
    variables = {
      JWT_SECRET     = local.effective_jwt_secret
      JWT_EXPIRES_IN = var.jwt_expires_in
    }
  }

  tags = local.common_tags
}
