variable "project_name" {
  description = "Base name used for all resources (lowercase, no spaces)."
  type        = string
  default     = "copilot-blueprint"
}

variable "environment" {
  description = "Deployment environment tag (e.g. dev, staging, prod)."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "location" {
  description = "Azure region for the App Service and supporting resources."
  type        = string
  default     = "eastus"
}

variable "openai_location" {
  description = <<-EOT
    Azure region for the Azure OpenAI resource.
    GPT-4o availability is region-specific — check
    https://learn.microsoft.com/azure/ai-services/openai/concepts/models
    for the current list. Recommended: eastus, swedencentral, westus.
  EOT
  type        = string
  default     = "eastus"
}

variable "openai_deployment_name" {
  description = "Name of the Azure OpenAI model deployment."
  type        = string
  default     = "gpt-4o"
}

variable "openai_model_version" {
  description = "Version of the GPT-4o model to deploy."
  type        = string
  default     = "2024-05-13"
}

variable "openai_capacity" {
  description = "Tokens-per-minute capacity for the model deployment (in thousands). 10 = 10K TPM."
  type        = number
  default     = 10
}

variable "app_service_sku" {
  description = <<-EOT
    App Service Plan SKU. Use B1 for dev/test, P1v3 or higher for production.
    Streaming responses require a plan that supports WebSockets / long-running requests.
  EOT
  type    = string
  default = "B1"

  validation {
    condition     = contains(["B1", "B2", "B3", "P0v3", "P1v3", "P2v3", "P3v3"], var.app_service_sku)
    error_message = "app_service_sku must be a valid Linux App Service SKU."
  }
}

variable "log_retention_days" {
  description = "Log Analytics workspace retention period in days."
  type        = number
  default     = 30
}
