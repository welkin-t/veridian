# Terraform configuration for Veridian infrastructure
terraform {
  required_version = ">=1.6"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.37.0"
    }
  }

  # Remote state backend configuration
  # This will be configured during terraform init
  backend "azurerm" {
    # Backend configuration will be supplied via -backend-config or backend.tfvars
    # resource_group_name  = var.resource_group_name   # Not supported in backend block
    # storage_account_name = var.storage_account_name  # Not supported in backend block  
    # container_name       = var.container_name        # Not supported in backend block
    # key                  = var.state_key             # Not supported in backend block
  }
}

# Configure the Azure Provider
provider "azurerm" {
  # Subscription ID explicitly set
  subscription_id = "ff15cd46-33c3-4134-b3a8-fe07a95ddcaa"
  
  features {
    # Enable key vault purge protection
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
    
    # Enable resource group prevent deletion
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

# Create Resource Group for Terraform state storage
resource "azurerm_resource_group" "tfstate" {
  name     = var.resource_group_name
  location = var.location

  tags = merge(var.tags, {
    Purpose = "terraform-state-storage"
  })
}

# Create Storage Account for Terraform state
#checkov:skip=CKV_AZURE_206:This is a terraform state backend, LRS is a cost-effective choice and acceptable for this non-critical resource.
resource "azurerm_storage_account" "tfstate" {
  name                = var.storage_account_name
  resource_group_name = azurerm_resource_group.tfstate.name
  location            = azurerm_resource_group.tfstate.location

  # Storage configuration for state files
  account_tier             = "Standard"
  account_replication_type = "LRS"  # Locally-redundant storage for backup

  # Security and compliance features
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = true
  public_network_access_enabled   = true

  network_rules {
    default_action             = "Deny"
    bypass                     = ["AzureServices"]
    ip_rules                   = ["185.233.247.77"]
  }

  # Enable hierarchical namespace if needed (Data Lake features)
  is_hns_enabled = false
  
  # Blob properties for versioning and soft delete
  blob_properties {
    versioning_enabled  = true
    change_feed_enabled = true
    
    # Soft delete for blobs
    delete_retention_policy {
      days = 30
    }
    
    # Soft delete for containers
    container_delete_retention_policy {
      days = 30
    }
  }

  tags = merge(var.tags, {
    Purpose = "terraform-state-storage"
  })
}

# Create blob container for Terraform state files
resource "azurerm_storage_container" "tfstate" {
  name                  = var.container_name
  storage_account_id    = azurerm_storage_account.tfstate.id
  container_access_type = "private"
}

# Output values for reference
output "storage_account_name" {
  description = "Name of the storage account"
  value       = azurerm_storage_account.tfstate.name
}

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.tfstate.name
}

output "container_name" {
  description = "Name of the storage container"
  value       = azurerm_storage_container.tfstate.name
}

output "storage_account_primary_access_key" {
  description = "Primary access key for the storage account"
  value       = azurerm_storage_account.tfstate.primary_access_key
  sensitive   = true
}
