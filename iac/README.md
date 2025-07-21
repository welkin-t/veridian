# Veridian Infrastructure as Code

This directory contains Terraform configuration for Veridian's cloud infrastructure on Azure.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.6
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- Azure subscription with appropriate permissions

## Quick Start

1. **Login to Azure:**
   ```bash
   az login
   az account set --subscription "<your-subscription-id>"
   ```

2. **Configure backend:**
   ```bash
   cp backend.tfvars.example backend.tfvars
   # Edit backend.tfvars with your values - ensure storage_account_name is globally unique
   ```

3. **Run setup script:**
   ```bash
   ./setup.sh
   ```

## Manual Setup (Alternative)

1. **Initialize and create infrastructure:**
   ```bash
   terraform init
   terraform plan -var-file="backend.tfvars"
   terraform apply -var-file="backend.tfvars"
   ```

2. **Migrate to remote backend:**
   ```bash
   terraform init -backend-config=backend.tfvars -reconfigure
   ```

## File Structure

```
iac/
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Variable definitions
├── backend.tfvars.example     # Example backend configuration
├── backend.tfvars             # Actual backend config (gitignored)
├── setup.sh                   # Automated setup script
└── README.md                  # This file
```

## Backend Configuration

The remote state backend uses Azure Storage with the following features:

- **State Locking**: Prevents concurrent modifications
- **Versioning**: Blob versioning enabled for state history
- **Geo-Redundant**: GRS replication for disaster recovery
- **Soft Delete**: 30-day retention for accidental deletions
- **Security**: Private container, TLS 1.2 minimum

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `resource_group_name` | Resource group for state storage | `rg-veridian-terraform-state` |
| `storage_account_name` | Storage account name (globally unique) | `saveridianterraform001` |
| `container_name` | Blob container name | `terraform-state` |
| `state_key` | State file key/path | `terraform.tfstate` |
| `location` | Azure region | `East US` |

## CI/CD Integration

For GitHub Actions, configure these secrets:

```yaml
env:
  ARM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
  ARM_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
  ARM_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
  ARM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
```

## Security Best Practices

- ✅ `backend.tfvars` is gitignored (contains sensitive values)
- ✅ Storage account uses private access only
- ✅ TLS 1.2 minimum enforced
- ✅ Soft delete enabled for protection
- ✅ Geo-redundant storage for backup

## Troubleshooting

### Storage Account Name Conflicts
If you get a naming conflict error:
1. Choose a globally unique storage account name
2. Update `storage_account_name` in `backend.tfvars`

### State Lock Issues
If state is locked:
```bash
terraform force-unlock <lock-id>
```

### Permission Issues
Ensure your Azure account has:
- Contributor or Owner role on the subscription
- Storage Blob Data Contributor on the storage account

## Cleanup

To destroy the backend infrastructure:
```bash
terraform destroy -var-file="backend.tfvars"
```

⚠️ **Warning**: This will delete your Terraform state storage. Only do this if you're sure!

## Next Steps

After setting up the backend:
1. Create additional infrastructure modules (compute, networking, databases)
2. Set up GitHub Actions for automated deployments
3. Configure different environments (dev, staging, prod)
