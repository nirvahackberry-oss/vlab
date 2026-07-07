resource "aws_dynamodb_table" "sessions" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sessionId"

  lifecycle {
    prevent_destroy = true
  }

  attribute {
    name = "sessionId"
    type = "S"
  }

  ttl {
    attribute_name = "expiryTime"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = var.dynamodb_table_name
  })
}

resource "aws_dynamodb_table" "submissions" {
  name         = var.submissions_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sessionId"

  lifecycle {
    prevent_destroy = true
  }

  attribute {
    name = "sessionId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = var.submissions_table_name
  })
}

resource "aws_dynamodb_table" "results" {
  name         = var.results_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sessionId"

  lifecycle {
    prevent_destroy = true
  }

  attribute {
    name = "sessionId"
    type = "S"
  }

  ttl {
    attribute_name = "expiryTime"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = var.results_table_name
  })
}

# Per-run execution outputs for job model (polling by runId).
resource "aws_dynamodb_table" "runs" {
  name         = var.runs_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "runId"

  lifecycle {
    prevent_destroy = true
  }

  attribute {
    name = "runId"
    type = "S"
  }

  attribute {
    name = "sessionId"
    type = "S"
  }

  global_secondary_index {
    name            = "bySession"
    hash_key        = "sessionId"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiryTime"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = var.runs_table_name
  })
}
