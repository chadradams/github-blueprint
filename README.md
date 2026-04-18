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

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/chadradams/github-blueprint.git
cd github-blueprint
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Azure AI Foundry credentials:

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01
```

> **Where to find these values:**
> - Endpoint and Key: Azure Portal → your OpenAI resource → *Keys and Endpoint*
> - Deployment name: [Azure AI Foundry](https://ai.azure.com) → *Deployments*

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
github-blueprint/
├── app/
│   ├── layout.tsx              # Root layout with GitHub nav
│   ├── page.tsx                # Landing page
│   ├── dashboard/page.tsx      # Blueprint gallery
│   ├── editor/page.tsx         # Split-panel editor
│   └── api/generate/route.ts  # Streaming Azure AI proxy
├── components/
│   ├── GitHubNav.tsx           # GitHub-style top navigation
│   └── editor/
│       ├── TypeSelector.tsx    # Blueprint type picker
│       ├── PromptPanel.tsx     # Left panel: prompt + settings
│       └── ArtifactPanel.tsx   # Right panel: Monaco + preview
└── lib/
    ├── types.ts                # Blueprint types and config
    └── prompts.ts              # System prompts for each type
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `AZURE_OPENAI_ENDPOINT` | Yes | Azure OpenAI resource URL |
| `AZURE_OPENAI_KEY` | Yes | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT` | Yes | Model deployment name (e.g. `gpt-4o`) |
| `AZURE_OPENAI_API_VERSION` | No | API version (default: `2024-02-01`) |

## Supported blueprint types

| Type | Output format | Preview |
|---|---|---|
| UI Wireframe | HTML | iframe |
| System Diagram | Mermaid | Rendered diagram |
| Visual Design | HTML + CSS | iframe |
| Code Blueprint | TypeScript | Code only |

## License

MIT
