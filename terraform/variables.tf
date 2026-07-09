variable "region" {
  description = "AWS region for all resources."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Base project name used for naming resources."
  type        = string
  default     = "vlab"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "lab_types" {
  description = "Supported lab types."
  type        = list(string)
  default = [
    "python",
    "java",
    "linux",
    "mysql",
    "postgres",
    "oracle",
    "agilemethodology",
    "android",
    "android-emulator",
    "bigdata",
    "datascience",
    "dotnet",
    "softwareengeering",
    "testing",
  ]

  validation {
    condition     = length(var.lab_types) > 0
    error_message = "lab_types must contain at least one lab type."
  }
}

variable "lab_image_aliases" {
  description = "Lab types that reuse another lab type's ECR image in ECS task definitions."
  type        = map(string)
  default = {
    agilemethodology = "java"
  }
}

variable "lab_cpu" {
  description = "CPU units for ECS task (e.g. 256, 512, 1024)."
  type        = number
  default     = 512
}

variable "lab_memory" {
  description = "Memory (MiB) for ECS task (e.g. 1024, 2048)."
  type        = number
  default     = 1024
}

variable "lab_cpu_by_type" {
  description = "Optional CPU overrides by lab type."
  type        = map(number)
  default = {
    oracle = 1024
  }
}

variable "lab_memory_by_type" {
  description = "Optional memory overrides by lab type."
  type        = map(number)
  default = {
    oracle = 4096
    java   = 2048
  }
}

variable "lab_ephemeral_storage_by_type" {
  description = "Optional ephemeral storage (GiB) overrides by lab type."
  type        = map(number)
  default = {
    oracle = 30
  }
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets."
  type        = bool
  default     = false
}

variable "lab_browser_ingress_cidr_blocks" {
  description = "CIDR blocks allowed to reach lab containers on 8080/8888 (browser iframe). Use 0.0.0.0/0 for student browsers."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "lab_control_plane_security_group_ids" {
  description = "Security group IDs allowed to reach lab tasks on 8080/8888 (set from your API/Lambda repo, e.g. [aws_security_group.api_lambda.id])."
  type        = list(string)
  default     = []
}

variable "enable_temp_data_bucket" {
  description = "Enable optional S3 bucket for temporary lab data."
  type        = bool
  default     = false
}

variable "dynamodb_table_name" {
  description = "DynamoDB session table name."
  type        = string
  default     = "vlab-sessions"
}

variable "submissions_table_name" {
  description = "DynamoDB submissions table name."
  type        = string
  default     = "lab-submissions"
}

variable "results_table_name" {
  description = "DynamoDB results table name."
  type        = string
  default     = "lab-results"
}

variable "runs_table_name" {
  description = "DynamoDB runs table name (per-run output for polling)."
  type        = string
  default     = "vlab-runs"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC."
  type        = string
  default     = "10.40.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs."
  type        = list(string)
  default     = ["10.40.1.0/24", "10.40.2.0/24"]
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs."
  type        = list(string)
  default     = ["10.40.101.0/24", "10.40.102.0/24"]
}

variable "lab_environment" {
  description = "Static environment variables injected into lab tasks."
  type        = map(string)
  default = {
    PYTHONUNBUFFERED = "1"
  }
}

variable "ephemeral_storage_gib" {
  description = "Ephemeral storage size in GiB for Fargate task."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Additional tags to apply to all resources."
  type        = map(string)
  default     = {}
}
