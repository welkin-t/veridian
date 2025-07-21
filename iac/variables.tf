# Variables for Terraform backend configuration
# Used to define Azure Storage backend for state management

variable "resource_group_name" {
  description = "Name of the Azure Resource Group for Terraform state storage"
  type        = string
}

variable "storage_account_name" {
  description = "Name of the Azure Storage Account for Terraform state (must be globally unique)"
  type        = string
}

variable "container_name" {
  description = "Name of the blob container for Terraform state files"
  type        = string
  default     = "terraform-state"
}

variable "state_key" {
  description = "Key/path for the Terraform state file within the container"
  type        = string
  default     = "terraform.tfstate"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "polandcentral"
}

# Optional variables for enhanced configuration
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project for resource naming"
  type        = string
  default     = "veridian"
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "veridian"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
