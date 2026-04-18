export type BlueprintType = 'wireframe' | 'system-diagram' | 'visual-design' | 'code-blueprint';

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
