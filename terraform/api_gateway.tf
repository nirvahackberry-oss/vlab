resource "aws_apigatewayv2_api" "lab" {
  name          = "${local.name_prefix}-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["content-type", "authorization"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_origins = ["*"]
    max_age       = 3600
  }

  tags = local.common_tags
}

resource "aws_apigatewayv2_stage" "lab" {
  api_id      = aws_apigatewayv2_api.lab.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      requestTime    = "$context.requestTime"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
      integration    = "$context.integrationErrorMessage"
    })
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.name_prefix}-http-api"
  retention_in_days = 14
  tags              = local.common_tags
}

resource "aws_apigatewayv2_integration" "start_lab" {
  api_id                 = aws_apigatewayv2_api.lab.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.start_lab.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "execute_code" {
  api_id                 = aws_apigatewayv2_api.lab.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.execute_code.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "submit_code" {
  api_id                 = aws_apigatewayv2_api.lab.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.submit_code.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "grade_lab" {
  api_id                 = aws_apigatewayv2_api.lab.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.grade_lab.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "stop_lab" {
  api_id                 = aws_apigatewayv2_api.lab.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.stop_lab.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "get_result" {
  api_id                 = aws_apigatewayv2_api.lab.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_result.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "start" {
  api_id    = aws_apigatewayv2_api.lab.id
  route_key = "POST /start"
  target    = "integrations/${aws_apigatewayv2_integration.start_lab.id}"

  authorization_type = "NONE" # Placeholder: swap with JWT/CUSTOM authorizer in production.
}

resource "aws_apigatewayv2_route" "execute" {
  api_id    = aws_apigatewayv2_api.lab.id
  route_key = "POST /execute"
  target    = "integrations/${aws_apigatewayv2_integration.execute_code.id}"

  authorization_type = "NONE" # Placeholder: swap with JWT/CUSTOM authorizer in production.
}

resource "aws_apigatewayv2_route" "submit" {
  api_id    = aws_apigatewayv2_api.lab.id
  route_key = "POST /submit"
  target    = "integrations/${aws_apigatewayv2_integration.submit_code.id}"

  authorization_type = "NONE" # Placeholder: swap with JWT/CUSTOM authorizer in production.
}

resource "aws_apigatewayv2_route" "grade" {
  api_id    = aws_apigatewayv2_api.lab.id
  route_key = "POST /grade"
  target    = "integrations/${aws_apigatewayv2_integration.grade_lab.id}"

  authorization_type = "NONE" # Placeholder: swap with JWT/CUSTOM authorizer in production.
}

resource "aws_apigatewayv2_route" "stop" {
  api_id    = aws_apigatewayv2_api.lab.id
  route_key = "POST /stop"
  target    = "integrations/${aws_apigatewayv2_integration.stop_lab.id}"

  authorization_type = "NONE" # Placeholder: swap with JWT/CUSTOM authorizer in production.
}

resource "aws_apigatewayv2_route" "result" {
  api_id    = aws_apigatewayv2_api.lab.id
  route_key = "GET /result"
  target    = "integrations/${aws_apigatewayv2_integration.get_result.id}"

  authorization_type = "NONE" # Placeholder: swap with JWT/CUSTOM authorizer in production.
}

resource "aws_lambda_permission" "apigw_start" {
  statement_id  = "AllowApiGatewayInvokeStartLab"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.start_lab.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lab.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_execute" {
  statement_id  = "AllowApiGatewayInvokeExecuteCode"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.execute_code.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lab.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_submit" {
  statement_id  = "AllowApiGatewayInvokeSubmitCode"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submit_code.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lab.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_grade" {
  statement_id  = "AllowApiGatewayInvokeGradeLab"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.grade_lab.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lab.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_stop" {
  statement_id  = "AllowApiGatewayInvokeStopLab"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stop_lab.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lab.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_result" {
  statement_id  = "AllowApiGatewayInvokeGetResult"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_result.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lab.execution_arn}/*/*"
}
