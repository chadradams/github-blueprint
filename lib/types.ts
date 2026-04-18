export type BlueprintType = 'wireframe' | 'system-diagram' | 'visual-design' | 'code-blueprint';

export type ChatPhase = 'clarify' | 'generate' | 'refine';

// ── GitHub integration ────────────────────────────────────────────────────────

export interface GitHubSession {
  token: string;
  login: string;
  avatarUrl: string;
}

export interface GitHubRepo {
  fullName: string;   // "owner/repo"
  name: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  private: boolean;
}

export interface GitHubContext {
  repoFullName: string;
  branch: string;
  issueNumber?: number;
  issueType?: 'issue' | 'pr';
  // Pre-formatted text blocks injected into AI prompts
  repoText: string;
  issueText?: string;
}

// ── Stored blueprint (Cosmos DB) ──────────────────────────────────────────────

export interface StoredBlueprint {
  id: string;
  type: BlueprintType;
  title: string;
  messages: ChatMessage[];
  output: string;
  repoFullName?: string;
  branch?: string;
  issueNumber?: number;
  issueType?: 'issue' | 'pr';
  createdBy: string;   // GitHub login
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isArtifact?: boolean;
  isStreaming?: boolean;
}

// Sentinel prefixed to streamed responses that contain artifact code.
// Distinct enough that it will never appear in generated code or prose.
export const ARTIFACT_MARKER = '__BLUEPRINT_ARTIFACT__';

export interface Blueprint {
  id: string;
  title: string;
  type: BlueprintType;
  prompt: string;
  output: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlueprintTypeConfig {
  id: BlueprintType;
  label: string;
  description: string;
  outputLanguage: string;
  placeholder: string;
  previewMode: 'html' | 'mermaid' | 'code';
}

export const BLUEPRINT_TYPES: BlueprintTypeConfig[] = [
  {
    id: 'wireframe',
    label: 'UI Wireframe',
    description: 'Low-fidelity page & component layouts',
    outputLanguage: 'html',
    placeholder: 'Describe the page or component you want to wireframe — e.g. "A GitHub repository settings page with sections for general settings, branch protection rules, and webhooks"',
    previewMode: 'html',
  },
  {
    id: 'system-diagram',
    label: 'System Diagram',
    description: 'Architecture, ERDs, sequence & flowcharts',
    outputLanguage: 'mermaid',
    placeholder: 'Describe the system to diagram — e.g. "A CI/CD pipeline from GitHub push to Kubernetes deployment with build, test, security scan, and deploy stages"',
    previewMode: 'mermaid',
  },
  {
    id: 'visual-design',
    label: 'Visual Design',
    description: 'High-fidelity GitHub-themed mockups',
    outputLanguage: 'html',
    placeholder: 'Describe the UI to design — e.g. "A Copilot chat panel embedded in the GitHub code editor with suggested code completions and conversation history"',
    previewMode: 'html',
  },
  {
    id: 'code-blueprint',
    label: 'Code Blueprint',
    description: 'File structures, interfaces & architecture',
    outputLanguage: 'typescript',
    placeholder: 'Describe the codebase to blueprint — e.g. "A Next.js SaaS app with authentication, billing via Stripe, a REST API, and a React dashboard"',
    previewMode: 'code',
  },
];
