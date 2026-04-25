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
  default     = ["python", "java", "linux", "dbms"]

  validation {
    condition     = length(var.lab_types) > 0
    error_message = "lab_types must contain at least one lab type."
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
  default     = {}
}

variable "lab_memory_by_type" {
  description = "Optional memory overrides by lab type."
  type        = map(number)
  default     = {}
}

variable "session_timeout_minutes" {
  description = "Default lab session timeout in minutes."
  type        = number
  default     = 60
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets."
  type        = bool
  default     = false
}

variable "enable_alb" {
  description = "Enable optional ALB resources."
  type        = bool
  default     = false
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

variable "lab_container_port" {
  description = "Container port used by the lab image."
  type        = number
  default     = 8888
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
