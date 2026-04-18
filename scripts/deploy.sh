#!/usr/bin/env bash
# deploy.sh — full Azure deploy for Copilot Blueprint
# Usage: ./scripts/deploy.sh [--tenant <id>] [--subscription <id>] [--env <dev|staging|prod>]
#
# Non-interactive (CI/service principal):
#   ARM_TENANT_ID, ARM_SUBSCRIPTION_ID, ARM_CLIENT_ID, ARM_CLIENT_SECRET must be set.
#
# Interactive:
#   Run without env vars — the script will call `az login` for you.

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[blueprint]${NC} $*"; }
success() { echo -e "${GREEN}[blueprint]${NC} $*"; }
warn()    { echo -e "${YELLOW}[blueprint]${NC} $*"; }
die()     { echo -e "${RED}[blueprint] ERROR:${NC} $*" >&2; exit 1; }

# ── Argument parsing ──────────────────────────────────────────────────────────
TENANT_ID="${ARM_TENANT_ID:-}"
SUBSCRIPTION_ID="${ARM_SUBSCRIPTION_ID:-}"
DEPLOY_ENV="dev"
SKIP_INFRA=false
SKIP_APP=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tenant)        TENANT_ID="$2";       shift 2 ;;
    --subscription)  SUBSCRIPTION_ID="$2"; shift 2 ;;
    --env)           DEPLOY_ENV="$2";      shift 2 ;;
    --skip-infra)    SKIP_INFRA=true;      shift   ;;
    --skip-app)      SKIP_APP=true;        shift   ;;
    --help|-h)
      echo "Usage: $0 [--tenant ID] [--subscription ID] [--env dev|staging|prod] [--skip-infra] [--skip-app]"
      exit 0 ;;
    *) die "Unknown argument: $1" ;;
  esac
done

# ── Prereq checks ─────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

info "Checking prerequisites…"
for cmd in az terraform node npm zip; do
  command -v "$cmd" >/dev/null 2>&1 || die "'$cmd' not found. Install it and re-run."
done

NODE_VER=$(node --version | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
[[ "$NODE_MAJOR" -ge 20 ]] || die "Node.js >= 20 required (found v${NODE_VER})"

TF_VER=$(terraform version -json | python3 -c "import sys,json; print(json.load(sys.stdin)['terraform_version'])" 2>/dev/null || terraform version | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
TF_MAJOR=$(echo "$TF_VER" | cut -d. -f1)
TF_MINOR=$(echo "$TF_VER" | cut -d. -f2)
[[ "$TF_MAJOR" -gt 1 || ( "$TF_MAJOR" -eq 1 && "$TF_MINOR" -ge 5 ) ]] || die "Terraform >= 1.5 required (found ${TF_VER})"

success "Prerequisites OK (Node v${NODE_VER}, Terraform ${TF_VER})"

# ── Azure login ───────────────────────────────────────────────────────────────
info "Checking Azure login…"

if [[ -n "${ARM_CLIENT_ID:-}" && -n "${ARM_CLIENT_SECRET:-}" && -n "${TENANT_ID}" && -n "${SUBSCRIPTION_ID}" ]]; then
  info "Service principal detected — logging in non-interactively."
  az login --service-principal \
    --username "$ARM_CLIENT_ID" \
    --password "$ARM_CLIENT_SECRET" \
    --tenant   "$TENANT_ID" \
    --output   none
else
  if ! az account show --output none 2>/dev/null; then
    info "Not logged in — launching 'az login'…"
    if [[ -n "$TENANT_ID" ]]; then
      az login --tenant "$TENANT_ID" --output none
    else
      az login --output none
    fi
  else
    info "Already logged in to Azure."
  fi
fi

if [[ -n "$SUBSCRIPTION_ID" ]]; then
  az account set --subscription "$SUBSCRIPTION_ID"
  success "Using subscription: $SUBSCRIPTION_ID"
else
  SUBSCRIPTION_ID=$(az account show --query id -o tsv)
  success "Using current subscription: $SUBSCRIPTION_ID"
fi

# ── terraform.tfvars ──────────────────────────────────────────────────────────
TF_DIR="$REPO_ROOT/terraform"
TFVARS="$TF_DIR/terraform.tfvars"

if [[ ! -f "$TFVARS" ]]; then
  warn "terraform.tfvars not found — copying from example."
  cp "$TF_DIR/terraform.tfvars.example" "$TFVARS"
  echo ""
  warn "────────────────────────────────────────────────────────────────"
  warn "  Edit $TFVARS before continuing."
  warn "  Required:"
  warn "    github_client_id     = \"<your GitHub OAuth App client ID>\""
  warn "    github_client_secret = \"<your GitHub OAuth App client secret>\""
  warn "    jwt_secret           = \"$(openssl rand -hex 32)\"  # pre-generated for you"
  warn "────────────────────────────────────────────────────────────────"
  echo ""
  read -r -p "  Press Enter once you've saved terraform.tfvars, or Ctrl-C to abort: "
fi

# Inject environment override
sed -i "s/^environment *= *\".*\"/environment = \"${DEPLOY_ENV}\"/" "$TFVARS"

# ── Terraform infra ───────────────────────────────────────────────────────────
if [[ "$SKIP_INFRA" == false ]]; then
  info "Running Terraform (environment: ${DEPLOY_ENV})…"
  cd "$TF_DIR"

  terraform init -upgrade -input=false

  info "Planning…"
  terraform plan -input=false -out=blueprint.tfplan

  echo ""
  read -r -p "  Apply the plan above? [y/N] " CONFIRM
  [[ "$CONFIRM" =~ ^[Yy]$ ]] || die "Aborted by user."

  info "Applying…"
  terraform apply -input=false blueprint.tfplan
  rm -f blueprint.tfplan

  success "Infrastructure provisioned."
  cd "$REPO_ROOT"
else
  warn "--skip-infra set — skipping Terraform."
fi

# ── Read Terraform outputs ────────────────────────────────────────────────────
info "Reading Terraform outputs…"
cd "$TF_DIR"

RG_NAME=$(terraform output -raw resource_group_name   2>/dev/null) || die "Could not read resource_group_name output"
APP_NAME=$(terraform output -raw web_app_name         2>/dev/null) || die "Could not read web_app_name output"
APP_URL=$(terraform output -raw web_app_url           2>/dev/null) || ""

cd "$REPO_ROOT"
success "Target app: ${APP_NAME} (${RG_NAME})"

# ── .env.local snippet ────────────────────────────────────────────────────────
ENV_SNIPPET_FILE="$REPO_ROOT/.env.local.generated"
info "Writing .env.local snippet → ${ENV_SNIPPET_FILE}"
cd "$TF_DIR"
terraform output -raw env_local_snippet > "$ENV_SNIPPET_FILE" 2>/dev/null || warn "Could not write env snippet (sensitive output may require -raw flag with correct permissions)."
cd "$REPO_ROOT"
if [[ -f "$ENV_SNIPPET_FILE" ]]; then
  success "Run: cp .env.local.generated .env.local"
fi

# ── Build Next.js app ─────────────────────────────────────────────────────────
if [[ "$SKIP_APP" == false ]]; then
  info "Installing dependencies…"
  npm ci --prefer-offline

  info "Building Next.js app…"
  NODE_ENV=production npm run build

  info "Creating deployment package…"
  ZIP_PATH="$REPO_ROOT/blueprint-deploy.zip"
  rm -f "$ZIP_PATH"

  zip -r "$ZIP_PATH" \
    .next \
    public \
    package.json \
    package-lock.json \
    next.config.mjs \
    --exclude "*.map" \
    --exclude ".next/cache/*"

  ZIP_SIZE=$(du -sh "$ZIP_PATH" | cut -f1)
  success "Package created: blueprint-deploy.zip (${ZIP_SIZE})"

  # ── Deploy to App Service ─────────────────────────────────────────────────
  info "Deploying to Azure App Service (${APP_NAME})…"
  az webapp deploy \
    --resource-group "$RG_NAME" \
    --name           "$APP_NAME" \
    --src-path       "$ZIP_PATH" \
    --type           zip \
    --timeout        600

  rm -f "$ZIP_PATH"
  success "App deployed."
else
  warn "--skip-app set — skipping build and deploy."
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Copilot Blueprint deployed successfully!${NC}"
echo ""
if [[ -n "$APP_URL" ]]; then
  echo -e "  URL:          ${CYAN}${APP_URL}${NC}"
fi
echo -e "  App Service:  ${APP_NAME}"
echo -e "  Resource group: ${RG_NAME}"
echo ""
echo -e "  Next steps:"
echo -e "  1. Configure your GitHub OAuth App callback URL:"
echo -e "     ${CYAN}${APP_URL}/api/github/callback${NC}"
echo -e "  2. Verify secrets are resolving in App Service:"
echo -e "     az webapp config appsettings list --name ${APP_NAME} --resource-group ${RG_NAME}"
echo -e "  3. Stream live logs:"
echo -e "     az webapp log tail --name ${APP_NAME} --resource-group ${RG_NAME}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
