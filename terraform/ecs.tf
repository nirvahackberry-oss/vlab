locals {
  lab_environment_list = [
    for k, v in var.lab_environment : {
      name  = k
      value = v
    }
  ]
  lab_container_port = {
    for lab_type in var.lab_types : lab_type => lab_type == "datascience" ? 8888 : 8080
  }
  lab_ecr_key = {
    for lab_type in var.lab_types : lab_type => lookup(var.lab_image_aliases, lab_type, lab_type)
  }
}

resource "aws_ecs_cluster" "lab" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  configuration {
    execute_command_configuration {
      logging = "DEFAULT"
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cluster"
  })
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/aws/ecs/${local.name_prefix}-lab"
  retention_in_days = 14

  tags = local.common_tags
}

resource "aws_ecs_task_definition" "lab" {
  for_each                 = toset(var.lab_types)
  family                   = "${local.name_prefix}-${each.key}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  # ECS Exec is enabled per task at launch (enableExecuteCommand in lambda/start_lab.py).
  cpu                = tostring(lookup(var.lab_cpu_by_type, each.key, var.lab_cpu))
  memory             = tostring(lookup(var.lab_memory_by_type, each.key, var.lab_memory))
  execution_role_arn = aws_iam_role.ecs_task_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  ephemeral_storage {
    size_in_gib = var.ephemeral_storage_gib
  }

  container_definitions = jsonencode([
    {
      name        = "lab-runtime"
      image       = "${aws_ecr_repository.lab_images[local.lab_ecr_key[each.key]].repository_url}:latest"
      essential   = true
      environment = local.lab_environment_list
      portMappings = [
        {
          containerPort = local.lab_container_port[each.key]
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = local.common_tags
}

resource "aws_s3_bucket" "temp_lab_data" {
  count  = var.enable_temp_data_bucket ? 1 : 0
  bucket = "${local.name_prefix}-temp-data-${random_string.bucket_suffix[0].result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-temp-data"
  })
}

resource "random_string" "bucket_suffix" {
  count   = var.enable_temp_data_bucket ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_public_access_block" "temp_lab_data" {
  count                   = var.enable_temp_data_bucket ? 1 : 0
  bucket                  = aws_s3_bucket.temp_lab_data[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "test_cases" {
  bucket = "${local.name_prefix}-test-cases-${random_string.test_cases_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-test-cases"
  })
}

resource "random_string" "test_cases_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_public_access_block" "test_cases" {
  bucket                  = aws_s3_bucket.test_cases.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
