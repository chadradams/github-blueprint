locals {
  # Short random suffix keeps global resource names unique
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
    always_on        = var.app_service_sku != "B1" # B1 does not support always-on
    http2_enabled    = true
    minimum_tls_version = "1.2"

    application_stack {
      node_version = "20-lts"
    }

    # Next.js standalone output is started with node server.js,
    # but a standard npm run start works for the default build output.
    startup_command = "npm run start"

    # Allow streaming responses (chunked transfer) from the generate API route.
    # Azure App Service needs websockets enabled for persistent connections.
    websockets_enabled = true
  }

  app_settings = {
    # Azure OpenAI — wired directly from the provisioned resource
    AZURE_OPENAI_ENDPOINT    = azurerm_cognitive_account.openai.endpoint
    AZURE_OPENAI_KEY         = azurerm_cognitive_account.openai.primary_access_key
    AZURE_OPENAI_DEPLOYMENT  = azurerm_cognitive_deployment.gpt4o.name
    AZURE_OPENAI_API_VERSION = "2024-02-01"

    # Node runtime
    NODE_ENV                         = "production"
    WEBSITE_NODE_DEFAULT_VERSION     = "~20"
    SCM_DO_BUILD_DURING_DEPLOYMENT   = "true"
    WEBSITE_RUN_FROM_PACKAGE         = "0"

    # Application Insights
    APPLICATIONINSIGHTS_CONNECTION_STRING       = azurerm_application_insights.this.connection_string
    ApplicationInsightsAgent_EXTENSION_VERSION  = "~3"
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
}
