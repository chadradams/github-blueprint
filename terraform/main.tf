locals {
  suffix = random_string.suffix.result

  tags = {
    project     = var.project_name
    environment = var.environment
    managed-by  = "terraform"
  }
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
  numeric = true
}

data "azurerm_client_config" "current" {}

# ── Resource group ────────────────────────────────────────────────────────────

resource "azurerm_resource_group" "this" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location
  tags     = local.tags
}

# ── Azure OpenAI (AI Foundry) ─────────────────────────────────────────────────

resource "azurerm_cognitive_account" "openai" {
  name                  = "${var.project_name}-oai-${local.suffix}"
  location              = var.openai_location
  resource_group_name   = azurerm_resource_group.this.name
  kind                  = "OpenAI"
  sku_name              = "S0"
  custom_subdomain_name = "${var.project_name}-${local.suffix}"
  tags                  = local.tags
}

resource "azurerm_cognitive_deployment" "gpt4o" {
  name                 = var.openai_deployment_name
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "gpt-4o"
    version = var.openai_model_version
  }

  scale {
    type     = "Standard"
    capacity = var.openai_capacity
  }
}

# ── Cosmos DB (blueprint persistence) ────────────────────────────────────────

resource "azurerm_cosmosdb_account" "this" {
  name                = "${var.project_name}-cosmos-${local.suffix}"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"
  tags                = local.tags

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }
}

resource "azurerm_cosmosdb_sql_database" "this" {
  name                = "copilot-blueprint"
  resource_group_name = azurerm_resource_group.this.name
  account_name        = azurerm_cosmosdb_account.this.name
}

resource "azurerm_cosmosdb_sql_container" "blueprints" {
  name                = "blueprints"
  resource_group_name = azurerm_resource_group.this.name
  account_name        = azurerm_cosmosdb_account.this.name
  database_name       = azurerm_cosmosdb_sql_database.this.name
  partition_key_path  = "/repoFullName"
  default_ttl         = -1

  indexing_policy {
    indexing_mode = "consistent"
    included_path { path = "/*" }
    # Exclude large artifact content from the index to save RUs
    excluded_path { path = "/output/*" }
  }
}

# ── Key Vault (secrets) ───────────────────────────────────────────────────────

resource "azurerm_key_vault" "this" {
  name                = "${var.project_name}-kv-${local.suffix}"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"
  tags                = local.tags

  # Soft-delete is enabled by default; allow purge on destroy for dev envs
  purge_protection_enabled = var.environment == "prod" ? true : false
}

# Allow the Terraform deployer to manage secrets
resource "azurerm_key_vault_access_policy" "deployer" {
  key_vault_id = azurerm_key_vault.this.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = ["Get", "List", "Set", "Delete", "Purge", "Recover"]
}

# Allow the App Service managed identity to read secrets
resource "azurerm_key_vault_access_policy" "app" {
  key_vault_id = azurerm_key_vault.this.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_web_app.this.identity[0].principal_id

  secret_permissions = ["Get", "List"]

  depends_on = [azurerm_linux_web_app.this]
}

resource "azurerm_key_vault_secret" "openai_key" {
  name         = "openai-key"
  value        = azurerm_cognitive_account.openai.primary_access_key
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_key_vault_access_policy.deployer]
}

resource "azurerm_key_vault_secret" "cosmos_key" {
  name         = "cosmos-key"
  value        = azurerm_cosmosdb_account.this.primary_key
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_key_vault_access_policy.deployer]
}

resource "azurerm_key_vault_secret" "github_client_secret" {
  name         = "github-client-secret"
  value        = var.github_client_secret
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_key_vault_access_policy.deployer]
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = var.jwt_secret
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_key_vault_access_policy.deployer]
}

# ── Observability ─────────────────────────────────────────────────────────────

resource "azurerm_log_analytics_workspace" "this" {
  name                = "${var.project_name}-logs-${local.suffix}"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  sku                 = "PerGB2018"
  retention_in_days   = var.log_retention_days
  tags                = local.tags
}

resource "azurerm_application_insights" "this" {
  name                = "${var.project_name}-insights-${local.suffix}"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  workspace_id        = azurerm_log_analytics_workspace.this.id
  application_type    = "Node.JS"
  tags                = local.tags
}

# ── App Service (Next.js host) ────────────────────────────────────────────────

resource "azurerm_service_plan" "this" {
  name                = "${var.project_name}-plan-${local.suffix}"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  os_type             = "Linux"
  sku_name            = var.app_service_sku
  tags                = local.tags
}

resource "azurerm_linux_web_app" "this" {
  name                = "${var.project_name}-app-${local.suffix}"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  service_plan_id     = azurerm_service_plan.this.id
  https_only          = true
  tags                = local.tags

  site_config {
    always_on           = var.app_service_sku != "B1"
    http2_enabled       = true
    minimum_tls_version = "1.2"
    websockets_enabled  = true

    application_stack {
      node_version = "20-lts"
    }

    startup_command = "npm run start"
  }

  app_settings = {
    # Azure OpenAI — key resolved from Key Vault at runtime
    AZURE_OPENAI_ENDPOINT    = azurerm_cognitive_account.openai.endpoint
    AZURE_OPENAI_KEY         = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.openai_key.versionless_id})"
    AZURE_OPENAI_DEPLOYMENT  = azurerm_cognitive_deployment.gpt4o.name
    AZURE_OPENAI_API_VERSION = "2024-02-01"

    # Cosmos DB — key resolved from Key Vault at runtime
    COSMOS_ENDPOINT = azurerm_cosmosdb_account.this.endpoint
    COSMOS_KEY      = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.cosmos_key.versionless_id})"

    # GitHub OAuth — secret resolved from Key Vault at runtime
    GITHUB_CLIENT_ID     = var.github_client_id
    GITHUB_CLIENT_SECRET = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.github_client_secret.versionless_id})"

    # JWT session signing — resolved from Key Vault at runtime
    JWT_SECRET = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.jwt_secret.versionless_id})"

    # Node runtime
    NODE_ENV                       = "production"
    WEBSITE_NODE_DEFAULT_VERSION   = "~20"
    SCM_DO_BUILD_DURING_DEPLOYMENT = "true"
    WEBSITE_RUN_FROM_PACKAGE       = "0"

    # Application Insights
    APPLICATIONINSIGHTS_CONNECTION_STRING      = azurerm_application_insights.this.connection_string
    ApplicationInsightsAgent_EXTENSION_VERSION = "~3"
  }

  identity {
    type = "SystemAssigned"
  }

  logs {
    http_logs {
      retention_in_days = 7
    }
    application_logs {
      file_system_level = "Warning"
    }
  }

  depends_on = [
    azurerm_key_vault_secret.openai_key,
    azurerm_key_vault_secret.cosmos_key,
    azurerm_key_vault_secret.github_client_secret,
    azurerm_key_vault_secret.jwt_secret,
  ]
}
