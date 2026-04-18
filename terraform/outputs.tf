output "resource_group_name" {
  description = "Name of the Azure resource group."
  value       = azurerm_resource_group.this.name
}

output "web_app_url" {
  description = "Public URL of the deployed Copilot Blueprint app."
  value       = "https://${azurerm_linux_web_app.this.default_hostname}"
}

output "web_app_name" {
  description = "Azure App Service name — used for az webapp deploy commands."
  value       = azurerm_linux_web_app.this.name
}

output "openai_endpoint" {
  description = "Azure OpenAI endpoint — matches AZURE_OPENAI_ENDPOINT in .env.local."
  value       = azurerm_cognitive_account.openai.endpoint
}

output "openai_deployment_name" {
  description = "Deployed model name — matches AZURE_OPENAI_DEPLOYMENT in .env.local."
  value       = azurerm_cognitive_deployment.gpt4o.name
}

output "app_insights_connection_string" {
  description = "Application Insights connection string for local development."
  value       = azurerm_application_insights.this.connection_string
  sensitive   = true
}

output "env_local_snippet" {
  description = "Ready-to-paste .env.local block for local development."
  sensitive   = true
  value       = <<-EOT
    AZURE_OPENAI_ENDPOINT=${azurerm_cognitive_account.openai.endpoint}
    AZURE_OPENAI_KEY=${azurerm_cognitive_account.openai.primary_access_key}
    AZURE_OPENAI_DEPLOYMENT=${azurerm_cognitive_deployment.gpt4o.name}
    AZURE_OPENAI_API_VERSION=2024-02-01
  EOT
}
