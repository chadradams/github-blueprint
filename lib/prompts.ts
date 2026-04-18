import { BlueprintType, ChatPhase, GitHubContext, ARTIFACT_MARKER } from './types';

function githubContextBlock(ctx?: GitHubContext): string {
  if (!ctx) return '';
  const lines = [
    '--- GitHub Context ---',
    ctx.repoText,
    ctx.issueText ? `\n${ctx.issueText}` : '',
    '--- End GitHub Context ---',
  ].filter(Boolean);
  return `\n\n${lines.join('\n')}\n\nUse the above GitHub context to make the generated artifact specific to this codebase and task — match existing naming conventions, tech stack, and UI patterns where relevant.`;
}

// ── Artifact generation rules (reused across phases) ──────────────────────────

const WIREFRAME_RULES = `
Generate a clean, low-fidelity HTML wireframe.
- Use only HTML with embedded <style> — no external dependencies
- Grayscale palette: backgrounds #f0f0f0/#e0e0e0, borders #bbb, text #333/#666
- Rectangle placeholders for images with a gray background and centered label
- Realistic placeholder text that reflects the described UI
- Include navigation, headers, content areas, sidebars, footers as appropriate
- Containers: border: 2px solid #bbb; border-radius: 4px
- Font: -apple-system, system-ui, sans-serif; font-size: 14px
- 100% width, auto height — no fixed viewport constraints
- Return ONLY the complete HTML document starting with <!DOCTYPE html>`;

const SYSTEM_DIAGRAM_RULES = `
Generate a Mermaid diagram.
- Choose the most appropriate type:
  flowchart TD/LR · sequenceDiagram · classDiagram · erDiagram · stateDiagram-v2
- Use descriptive node labels, not single letters
- Group related components with subgraph blocks
- Max 20-25 nodes for readability
- Return ONLY raw Mermaid code — no markdown fences, no explanation`;

const VISUAL_DESIGN_RULES = `
Generate a pixel-perfect GitHub-themed UI using only HTML with embedded <style>.
- No external dependencies or CDN links
- GitHub dark theme strictly:
    background #0d1117 · card #161b22 · border #30363d
    text #e6edf3 · muted #8b949e · accent #58a6ff
    Copilot purple #a371f7 · success #3fb950
    primary button: #238636 hover #2ea043
    secondary button: transparent / border #30363d hover #21262d
- Font: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif
- Border-radius: 6px for cards/buttons, 50% for avatars
- Hover states with transition: 0.1s ease
- Realistic labels, icons (Unicode/emoji used sparingly)
- 100% width, auto height
- Return ONLY the complete HTML document starting with <!DOCTYPE html>`;

const CODE_BLUEPRINT_RULES = `
Generate a comprehensive TypeScript code blueprint.
- Annotated file tree (every file with a one-line purpose comment)
- Key TypeScript interfaces and types
- Core module skeletons with method signatures
- Environment variable list with descriptions
- Dependency list with rationale
- Strict TypeScript, clean architecture, realistic names
- Return ONLY the code — file tree first, then types, then module skeletons`;

const ARTIFACT_RULES: Record<BlueprintType, string> = {
  'wireframe':      WIREFRAME_RULES,
  'system-diagram': SYSTEM_DIAGRAM_RULES,
  'visual-design':  VISUAL_DESIGN_RULES,
  'code-blueprint': CODE_BLUEPRINT_RULES,
};

// ── Clarifying questions per type ─────────────────────────────────────────────

const CLARIFY_FOCUS: Record<BlueprintType, string> = {
  'wireframe': `Focus your questions on:
- Target device (mobile, tablet, desktop, or responsive)
- Key sections or pages to include
- Primary user actions (e.g. form submission, navigation, data table)`,

  'system-diagram': `Focus your questions on:
- Diagram type that best fits (flow, sequence, class, ER, state machine)
- Main components or services involved
- Direction of data or control flow (sync vs async, request/response vs event)`,

  'visual-design': `Focus your questions on:
- Color accent preference (Copilot purple, GitHub blue, custom)
- Key UI regions (sidebar, modal, full page, component)
- Specific GitHub Primer components to include (buttons, labels, avatars, code blocks)`,

  'code-blueprint': `Focus your questions on:
- Primary language and framework (e.g. Next.js, FastAPI, Go)
- Authentication and data persistence needs
- Key feature modules or bounded contexts to scaffold`,
};

// ── System prompt builders ────────────────────────────────────────────────────

function clarifyPrompt(type: BlueprintType): string {
  const label = {
    'wireframe':      'UI wireframe',
    'system-diagram': 'system diagram',
    'visual-design':  'visual design',
    'code-blueprint': 'code blueprint',
  }[type];

  return `You are Copilot Blueprint, GitHub's AI design assistant.

The user wants to create a ${label}. Before generating anything, ask them 2-3 short, targeted clarifying questions so the output matches their exact needs.

${CLARIFY_FOCUS[type]}

Rules:
- Format as a plain numbered list — one question per line
- Keep each question to a single sentence
- Do not generate any code, diagrams, or designs yet
- Do not add a preamble or sign-off — start directly with "1."`;
}

function generatePrompt(type: BlueprintType): string {
  return `You are Copilot Blueprint, GitHub's AI design assistant.

Based on the conversation above, generate the complete artifact now.

IMPORTANT: Start your response with EXACTLY this token and nothing before it:
${ARTIFACT_MARKER}

Immediately after that token, output ONLY the artifact code with no explanation, no markdown fences, and no other text.

${ARTIFACT_RULES[type]}`;
}

function refinePrompt(type: BlueprintType, currentArtifact: string): string {
  return `You are Copilot Blueprint, GitHub's AI design assistant.

The user wants to refine their existing ${type}. Here is the current artifact:

--- CURRENT ARTIFACT START ---
${currentArtifact}
--- CURRENT ARTIFACT END ---

Apply the user's requested changes and return the complete updated artifact.

IMPORTANT: Start your response with EXACTLY this token and nothing before it:
${ARTIFACT_MARKER}

Immediately after that token, output ONLY the complete updated artifact code.

${ARTIFACT_RULES[type]}`;
}

export function buildSystemPrompt(
  type: BlueprintType,
  phase: ChatPhase,
  currentArtifact?: string,
  githubContext?: GitHubContext,
): string {
  const ctx = githubContextBlock(githubContext);
  switch (phase) {
    case 'clarify':  return clarifyPrompt(type) + ctx;
    case 'generate': return generatePrompt(type) + ctx;
    case 'refine':   return refinePrompt(type, currentArtifact ?? '') + ctx;
  }
}

// Keep legacy export so nothing else breaks if imported elsewhere
export function getSystemPrompt(type: BlueprintType): string {
  return generatePrompt(type);
}
