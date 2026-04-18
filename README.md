# Copilot Blueprint

> AI-powered UI wireframes, system diagrams, visual designs, and code blueprints — built into GitHub.

Copilot Blueprint is a GitHub-themed design tool that generates production-ready design artifacts from a natural language prompt. It connects to **Azure AI Foundry** as its AI backend and renders output in a Monaco code editor with a live preview panel.

![Blueprint type selector showing Wireframe, System Diagram, Visual Design, and Code Blueprint options](https://via.placeholder.com/900x480/0d1117/a371f7?text=Copilot+Blueprint)

## Features

- **UI Wireframes** — Low-fidelity HTML layouts for pages and components
- **System Diagrams** — Mermaid-based architecture diagrams, ERDs, sequence diagrams, and flowcharts
- **Visual Designs** — High-fidelity mockups using GitHub's Primer dark theme
- **Code Blueprints** — TypeScript file trees, interfaces, and module skeletons
- **Streaming generation** — Output streams token-by-token via Azure AI Foundry
- **Live preview** — HTML outputs render in a sandboxed iframe; Mermaid diagrams render inline
- **Monaco editor** — Custom GitHub Dark theme with copy and download actions
- **GitHub-native UI** — Primer color system, dark theme, breadcrumb navigation

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + GitHub Primer tokens |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Diagrams | Mermaid.js |
| AI backend | Azure AI Foundry (Azure OpenAI) |
| Infrastructure | Terraform (azurerm ~> 3.100) |
| Observability | Azure Application Insights + Log Analytics |

---

## Development

### Prerequisites

- Node.js >= 20 LTS
- An Azure subscription with access to Azure OpenAI (GPT-4o)

### 1. Clone and install

```bash
git clone https://github.com/chadradams/github-blueprint.git
cd github-blueprint
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Azure AI Foundry credentials:

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01

# Optional — enables Application Insights in local dev (see Observability section)
APPLICATIONINSIGHTS_CONNECTION_STRING=
```

> **Where to find these values:**
> - Endpoint and Key: Azure Portal → your OpenAI resource → *Keys and Endpoint*
> - Deployment name: [Azure AI Foundry](https://ai.azure.com) → *Deployments*
>
> Or run `terraform output -raw env_local_snippet` after a Terraform apply to get all values pre-filled.

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app hot-reloads on file save.

### Useful scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server with hot reload |
| `npm run build` | Production build (outputs to `.next/`) |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across all source files |

### How the streaming API route works

`POST /api/generate` accepts `{ prompt, type }` and proxies a streaming request to Azure OpenAI. The response is a `ReadableStream` of plain text chunks — the client reads them with a `fetch` + `ReadableStreamDefaultReader` loop and appends each chunk to the Monaco editor in real time.

```
Browser → POST /api/generate → AzureOpenAI.chat.completions.create(stream:true)
                                      ↓ chunks
                             ReadableStream → Response → fetch reader → setOutput()
```

If the connection is interrupted mid-stream, the server-side `AbortController` is signalled via the `cancel()` callback on the `ReadableStream`, which stops token generation on the Azure side.

### Project structure

```
github-blueprint/
├── app/
│   ├── layout.tsx               # Root layout with GitHub nav
│   ├── page.tsx                 # Feature landing page
│   ├── dashboard/page.tsx       # Blueprint gallery with search + filter
│   ├── editor/page.tsx          # Split-panel editor (prompt + artifact)
│   └── api/generate/route.ts   # Streaming Azure OpenAI proxy
├── components/
│   ├── GitHubNav.tsx            # GitHub-style top navigation bar
│   └── editor/
│       ├── TypeSelector.tsx     # Blueprint type picker (4 types)
│       ├── PromptPanel.tsx      # Left panel: prompt, examples, generate button
│       └── ArtifactPanel.tsx    # Right panel: Monaco editor + preview tabs
├── lib/
│   ├── types.ts                 # BlueprintType union + BLUEPRINT_TYPES config
│   └── prompts.ts               # System prompts for each blueprint type
└── terraform/                   # Azure infrastructure (see Infrastructure section)
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `AZURE_OPENAI_ENDPOINT` | Yes | Azure OpenAI resource URL |
| `AZURE_OPENAI_KEY` | Yes | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT` | Yes | Model deployment name (e.g. `gpt-4o`) |
| `AZURE_OPENAI_API_VERSION` | No | API version — default `2024-02-01` |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | No | Enables local telemetry (see Observability) |

---

## Infrastructure (Terraform)

The `terraform/` directory provisions all required Azure resources in a single `apply`.

### Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) logged in to your subscription

### Deploy infrastructure

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — set project_name, location, openai_location, sku

az login
terraform init
terraform plan -out=blueprint.tfplan
terraform apply blueprint.tfplan
```

After apply, print a ready-to-paste `.env.local` block:

```bash
terraform output -raw env_local_snippet
```

### Deployed resources

| Resource | Name pattern | Purpose |
|---|---|---|
| `azurerm_resource_group` | `<project>-<env>-rg` | Container for all resources |
| `azurerm_cognitive_account` | `<project>-oai-<suffix>` | Azure OpenAI / AI Foundry endpoint |
| `azurerm_cognitive_deployment` | `gpt-4o` | GPT-4o model deployment (Standard SKU) |
| `azurerm_service_plan` | `<project>-plan-<suffix>` | Linux App Service Plan |
| `azurerm_linux_web_app` | `<project>-app-<suffix>` | Next.js host — env vars pre-wired from OpenAI outputs |
| `azurerm_log_analytics_workspace` | `<project>-logs-<suffix>` | Centralised log sink |
| `azurerm_application_insights` | `<project>-insights-<suffix>` | Performance + error monitoring |

All resource names include a random 6-character suffix to ensure global uniqueness.

### Terraform variables

| Variable | Default | Description |
|---|---|---|
| `project_name` | `copilot-blueprint` | Base name for all resources |
| `environment` | `dev` | Tag: `dev`, `staging`, or `prod` |
| `location` | `eastus` | Region for App Service + observability |
| `openai_location` | `eastus` | Region for Azure OpenAI (must support GPT-4o) |
| `openai_deployment_name` | `gpt-4o` | Model deployment name |
| `openai_model_version` | `2024-05-13` | GPT-4o model version |
| `openai_capacity` | `10` | Tokens-per-minute capacity (in thousands) |
| `app_service_sku` | `B1` | App Service SKU — use `P1v3`+ for production |
| `log_retention_days` | `30` | Log Analytics retention period |

### Deploy the app after `terraform apply`

```bash
# Build and zip-deploy from repo root
npm run build
zip -r app.zip .next package.json package-lock.json next.config.mjs

az webapp deploy \
  --resource-group $(cd terraform && terraform output -raw resource_group_name) \
  --name        $(cd terraform && terraform output -raw web_app_name) \
  --src-path    app.zip \
  --type        zip
```

### Tear down

```bash
cd terraform
terraform destroy
```

---

## Observability

Copilot Blueprint ships with Azure Application Insights wired in via Terraform. Here's how to use it in each environment.

### In production (App Service)

The `APPLICATIONINSIGHTS_CONNECTION_STRING` and `ApplicationInsightsAgent_EXTENSION_VERSION=~3` app settings are set automatically by Terraform. The App Service Node.js agent auto-instruments:

- HTTP request traces (including the `/api/generate` streaming route)
- Dependency calls (outbound Azure OpenAI requests, with duration + status)
- Unhandled exceptions and server-side errors
- Custom events and metrics you emit with the SDK

No code changes are required — the agent attaches at startup.

### In local development

Add the connection string to `.env.local` to send telemetry from your local machine to the same Application Insights resource:

```env
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...;IngestionEndpoint=...
```

Get the value from Terraform:

```bash
cd terraform && terraform output -raw app_insights_connection_string
```

Or from the Azure Portal: **Application Insights** → your resource → *Overview* → *Connection String*.

### Viewing telemetry

| What to look at | Where in Azure Portal |
|---|---|
| Live request traces | Application Insights → *Transaction search* |
| Request failures + exceptions | Application Insights → *Failures* |
| Latency percentiles (p50/p95/p99) | Application Insights → *Performance* |
| Azure OpenAI dependency durations | Application Insights → *Performance* → *Dependencies* |
| Custom log queries | Log Analytics → *Logs* (KQL) |

### Useful KQL queries

Open **Log Analytics → Logs** and run against your workspace.

**All failed generate requests in the last 24 hours:**
```kusto
requests
| where timestamp > ago(24h)
| where url contains "/api/generate"
| where success == false
| project timestamp, resultCode, duration, cloud_RoleInstance
| order by timestamp desc
```

**p50 / p95 / p99 generation latency by hour:**
```kusto
requests
| where timestamp > ago(7d)
| where url contains "/api/generate"
| summarize
    p50 = percentile(duration, 50),
    p95 = percentile(duration, 95),
    p99 = percentile(duration, 99)
  by bin(timestamp, 1h)
| order by timestamp desc
```

**Azure OpenAI dependency call durations:**
```kusto
dependencies
| where timestamp > ago(24h)
| where type == "HTTP"
| where target contains "openai.azure.com"
| summarize avg(duration), max(duration), count() by bin(timestamp, 5m)
| order by timestamp desc
```

**Unhandled exceptions:**
```kusto
exceptions
| where timestamp > ago(24h)
| project timestamp, type, outerMessage, cloud_RoleInstance
| order by timestamp desc
```

---

## Supported blueprint types

| Type | Output format | Preview |
|---|---|---|
| UI Wireframe | HTML | Sandboxed iframe |
| System Diagram | Mermaid | Rendered diagram (mermaid.js) |
| Visual Design | HTML + CSS | Sandboxed iframe |
| Code Blueprint | TypeScript | Code editor only |

---

## License

MIT
