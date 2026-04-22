data "archive_file" "start_lab_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/start_lab.py"
  output_path = "${path.module}/start_lab.zip"
}

data "archive_file" "stop_lab_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/stop_lab.py"
  output_path = "${path.module}/stop_lab.zip"
}

data "archive_file" "execute_code_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/execute_code.py"
  output_path = "${path.module}/execute_code.zip"
}

data "archive_file" "submit_code_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/submit_code.py"
  output_path = "${path.module}/submit_code.zip"
}

data "archive_file" "grade_lab_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/grade_lab.py"
  output_path = "${path.module}/grade_lab.zip"
}

data "archive_file" "cleanup_expired_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/cleanup_expired.py"
  output_path = "${path.module}/cleanup_expired.zip"
}

data "archive_file" "get_result_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/get_result.py"
  output_path = "${path.module}/get_result.zip"
}

locals {
  resolved_lab_cpu_map = {
    for lab_type in var.lab_types : lab_type => tostring(lookup(var.lab_cpu_by_type, lab_type, var.lab_cpu))
  }
  resolved_lab_memory_map = {
    for lab_type in var.lab_types : lab_type => tostring(lookup(var.lab_memory_by_type, lab_type, var.lab_memory))
  }
}

resource "aws_cloudwatch_log_group" "start_lab_lambda" {
  name              = "/aws/lambda/${local.name_prefix}-start-lab"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "stop_lab_lambda" {
  name              = "/aws/lambda/${local.name_prefix}-stop-lab"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "execute_code_lambda" {
  name              = "/aws/lambda/${local.name_prefix}-execute-code"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "submit_code_lambda" {
  name              = "/aws/lambda/${local.name_prefix}-submit-code"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "grade_lab_lambda" {
  name              = "/aws/lambda/${local.name_prefix}-grade-lab"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "cleanup_expired_lambda" {
  name              = "/aws/lambda/${local.name_prefix}-cleanup-expired"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "get_result_lambda" {
  name              = "/aws/lambda/${local.name_prefix}-get-result"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_lambda_function" "start_lab" {
  function_name    = "${local.name_prefix}-start-lab"
  role             = aws_iam_role.start_lab_lambda.arn
  runtime          = "python3.12"
  handler          = "start_lab.lambda_handler"
  filename         = data.archive_file.start_lab_zip.output_path
  source_code_hash = data.archive_file.start_lab_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ECS_CLUSTER_ARN         = aws_ecs_cluster.lab.arn
      LAB_TASK_DEFINITION_MAP = jsonencode({ for lab_type, td in aws_ecs_task_definition.lab : lab_type => td.arn })
      ECS_SUBNET_IDS          = join(",", aws_subnet.private[*].id)
      ECS_SECURITY_GROUP_ID   = aws_security_group.ecs_tasks.id
      DYNAMODB_TABLE_NAME     = aws_dynamodb_table.sessions.name
      STOP_LAB_LAMBDA_ARN     = aws_lambda_function.stop_lab.arn
      SCHEDULER_ROLE_ARN      = aws_iam_role.scheduler_invoke_stop_lambda.arn
      SCHEDULER_GROUP_NAME    = aws_scheduler_schedule_group.lab.name
      DEFAULT_SESSION_TIMEOUT = tostring(var.session_timeout_minutes)
      ENABLE_ALB              = tostring(var.enable_alb)
      ALB_DNS_NAME            = var.enable_alb ? aws_lb.lab[0].dns_name : ""
      ALLOWED_LAB_TYPES       = join(",", var.lab_types)
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "stop_lab" {
  function_name    = "${local.name_prefix}-stop-lab"
  role             = aws_iam_role.stop_lab_lambda.arn
  runtime          = "python3.12"
  handler          = "stop_lab.lambda_handler"
  filename         = data.archive_file.stop_lab_zip.output_path
  source_code_hash = data.archive_file.stop_lab_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.sessions.name
      ECS_CLUSTER_ARN     = aws_ecs_cluster.lab.arn
      SCHEDULER_GROUP_NAME = aws_scheduler_schedule_group.lab.name
      GRADE_LAB_LAMBDA_ARN = aws_lambda_function.grade_lab.arn
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "execute_code" {
  function_name    = "${local.name_prefix}-execute-code"
  role             = aws_iam_role.lab_ops_lambda.arn
  runtime          = "python3.12"
  handler          = "execute_code.lambda_handler"
  filename         = data.archive_file.execute_code_zip.output_path
  source_code_hash = data.archive_file.execute_code_zip.output_base64sha256
  timeout          = 120
  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ECS_CLUSTER_ARN         = aws_ecs_cluster.lab.arn
      LAB_TASK_DEFINITION_MAP = jsonencode({ for lab_type, td in aws_ecs_task_definition.lab : lab_type => td.arn })
      ECS_SUBNET_IDS          = join(",", aws_subnet.private[*].id)
      ECS_SECURITY_GROUP_ID   = aws_security_group.ecs_tasks.id
      SESSIONS_TABLE_NAME     = aws_dynamodb_table.sessions.name
      LAB_LOG_GROUP_NAME      = aws_cloudwatch_log_group.ecs.name
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "submit_code" {
  function_name    = "${local.name_prefix}-submit-code"
  role             = aws_iam_role.lab_ops_lambda.arn
  runtime          = "python3.12"
  handler          = "submit_code.lambda_handler"
  filename         = data.archive_file.submit_code_zip.output_path
  source_code_hash = data.archive_file.submit_code_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      SESSIONS_TABLE_NAME   = aws_dynamodb_table.sessions.name
      SUBMISSIONS_TABLE_NAME = aws_dynamodb_table.submissions.name
      GRADE_LAB_LAMBDA_ARN  = aws_lambda_function.grade_lab.arn
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "grade_lab" {
  function_name    = "${local.name_prefix}-grade-lab"
  role             = aws_iam_role.lab_ops_lambda.arn
  runtime          = "python3.12"
  handler          = "grade_lab.lambda_handler"
  filename         = data.archive_file.grade_lab_zip.output_path
  source_code_hash = data.archive_file.grade_lab_zip.output_base64sha256
  timeout          = 180
  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ECS_CLUSTER_ARN         = aws_ecs_cluster.lab.arn
      LAB_TASK_DEFINITION_MAP = jsonencode({ for lab_type, td in aws_ecs_task_definition.lab : lab_type => td.arn })
      ECS_SUBNET_IDS          = join(",", aws_subnet.private[*].id)
      ECS_SECURITY_GROUP_ID   = aws_security_group.ecs_tasks.id
      SUBMISSIONS_TABLE_NAME  = aws_dynamodb_table.submissions.name
      RESULTS_TABLE_NAME      = aws_dynamodb_table.results.name
      SESSIONS_TABLE_NAME     = aws_dynamodb_table.sessions.name
      TEST_CASES_BUCKET       = aws_s3_bucket.test_cases.bucket
      LAB_LOG_GROUP_NAME      = aws_cloudwatch_log_group.ecs.name
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "cleanup_expired" {
  function_name    = "${local.name_prefix}-cleanup-expired"
  role             = aws_iam_role.lab_ops_lambda.arn
  runtime          = "python3.12"
  handler          = "cleanup_expired.lambda_handler"
  filename         = data.archive_file.cleanup_expired_zip.output_path
  source_code_hash = data.archive_file.cleanup_expired_zip.output_base64sha256
  timeout          = 120
  memory_size      = 256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      SESSIONS_TABLE_NAME   = aws_dynamodb_table.sessions.name
      STOP_LAB_LAMBDA_ARN   = aws_lambda_function.stop_lab.arn
      GRADE_LAB_LAMBDA_ARN  = aws_lambda_function.grade_lab.arn
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "get_result" {
  function_name    = "${local.name_prefix}-get-result"
  role             = aws_iam_role.lab_ops_lambda.arn
  runtime          = "python3.12"
  handler          = "get_result.lambda_handler"
  filename         = data.archive_file.get_result_zip.output_path
  source_code_hash = data.archive_file.get_result_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      RESULTS_TABLE_NAME  = aws_dynamodb_table.results.name
    }
  }

  tags = local.common_tags
}
