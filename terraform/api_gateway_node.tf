# JWT authorizer + Node.js API (replaces Python on HTTP API routes when use_node_api_gateway = true)

resource "aws_apigatewayv2_authorizer" "jwt" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id                            = aws_apigatewayv2_api.lab.id
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = aws_lambda_function.jwt_authorizer[0].invoke_arn
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
  identity_sources                  = ["$request.header.Authorization"]
  name                              = "${local.name_prefix}-jwt-authorizer"
}

resource "aws_apigatewayv2_integration" "node_api" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id                 = aws_apigatewayv2_api.lab.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.node_api[0].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

locals {
  node_route_auth = {
    authorization_type = "CUSTOM"
    authorizer_id      = aws_apigatewayv2_authorizer.jwt[0].id
  }
  node_route_public = {
    authorization_type = "NONE"
  }
}

# --- Public routes (no JWT) ---

resource "aws_apigatewayv2_route" "health" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id    = aws_apigatewayv2_api.lab.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
}

resource "aws_apigatewayv2_route" "auth_login" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id    = aws_apigatewayv2_api.lab.id
  route_key = "POST /auth/login"
  target    = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
}

# --- Protected routes (JWT authorizer) ---

resource "aws_apigatewayv2_route" "node_labs" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "GET /labs"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_apigatewayv2_route" "node_lab_detail" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "GET /labs/{labId}"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_apigatewayv2_route" "node_lab_sessions" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "POST /lab-sessions"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_apigatewayv2_route" "node_session_user" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "GET /lab-sessions/user/{userId}"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_apigatewayv2_route" "node_session_status" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "GET /lab-sessions/{sessionId}"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_apigatewayv2_route" "node_session_stop" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "POST /lab-sessions/{sessionId}/stop"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_apigatewayv2_route" "node_execute" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "POST /runs"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_apigatewayv2_route" "node_run_legacy" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "POST /run"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_apigatewayv2_route" "node_get_run" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "GET /runs/{runId}"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_apigatewayv2_route" "node_submit" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "POST /submit"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_apigatewayv2_route" "node_files" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "GET /files"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_apigatewayv2_route" "node_files_content" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "GET /files/content"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_apigatewayv2_route" "node_save" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "POST /save"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_apigatewayv2_route" "node_files_delete" {
  count = var.use_node_api_gateway ? 1 : 0

  api_id             = aws_apigatewayv2_api.lab.id
  route_key          = "DELETE /files"
  target             = "integrations/${aws_apigatewayv2_integration.node_api[0].id}"
  authorization_type = local.node_route_auth.authorization_type
  authorizer_id      = local.node_route_auth.authorizer_id
}

resource "aws_lambda_permission" "apigw_node_api" {
  count = var.use_node_api_gateway ? 1 : 0

  statement_id  = "AllowApiGatewayInvokeNodeApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.node_api[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lab.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_jwt_authorizer" {
  count = var.use_node_api_gateway ? 1 : 0

  statement_id  = "AllowApiGatewayInvokeJwtAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.jwt_authorizer[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lab.execution_arn}/*/*"
}
