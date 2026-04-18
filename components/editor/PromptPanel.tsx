'use client';

import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import TypeSelector from './TypeSelector';
import { BlueprintType, BLUEPRINT_TYPES } from '@/lib/types';

const EXAMPLE_PROMPTS: Record<BlueprintType, string[]> = {
  'wireframe': [
    'GitHub repository settings page with general, branch protection, webhooks, and Codespaces sections',
    'Pull request review interface with file diff viewer, inline comments, and approval workflow',
    'GitHub Actions workflow editor with a visual job graph and step configuration panel',
  ],
  'system-diagram': [
    'GitHub Actions CI/CD pipeline from push event to Kubernetes deployment with build, test, security scan, and release stages',
    'Microservices architecture for a GitHub app with webhook receiver, event processor, notification service, and database',
    'OAuth 2.0 authentication flow between a GitHub App, user browser, and third-party service',
  ],
  'visual-design': [
    'Copilot Blueprint editor page with a split panel showing a prompt input on the left and Monaco code editor on the right',
    'GitHub dark-themed dashboard with a sidebar navigation, stats cards, and a data table',
    'Repository homepage redesign with an AI-powered README summary, contributor activity heatmap, and Copilot suggested improvements',
  ],
  'code-blueprint': [
    'Next.js SaaS application with Clerk auth, Stripe billing, Prisma ORM, REST API routes, and React dashboard',
    'GitHub App built with Probot that auto-labels issues, assigns reviewers, and posts PR summaries via Copilot',
    'Real-time collaborative code editor using Next.js, Yjs CRDTs, WebSockets, and Monaco Editor',
  ],
};

interface Props {
  type: BlueprintType;
  onTypeChange: (type: BlueprintType) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  hasOutput: boolean;
  onReset: () => void;
}

export default function PromptPanel({
  type, onTypeChange,
  prompt, onPromptChange,
  onGenerate, isGenerating,
  hasOutput, onReset,
}: Props) {
  const [showExamples, setShowExamples] = useState(false);
  const typeConfig = BLUEPRINT_TYPES.find((t) => t.id === type)!;

  return (
    <div
      style={{
        backgroundColor: '#161b22',
        borderRight: '1px solid #30363d',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #30363d', flexShrink: 0 }}>
        <div className="flex items-center gap-2">
          <div
            style={{ background: 'linear-gradient(135deg, #8957e5, #1f6feb)', borderRadius: '6px', padding: '4px' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span style={{ color: '#e6edf3', fontWeight: '600', fontSize: '14px' }}>Copilot Blueprint</span>
          <span
            style={{ backgroundColor: '#8957e520', color: '#a371f7', borderRadius: '20px', fontSize: '10px', fontWeight: '600', padding: '1px 6px' }}
          >
            BETA
          </span>
        </div>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Blueprint type */}
        <div>
          <label style={{ color: '#8b949e', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
            Blueprint type
          </label>
          <TypeSelector value={type} onChange={onTypeChange} disabled={isGenerating} />
        </div>

        {/* Prompt */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ color: '#8b949e', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
            Describe your design
          </label>
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={typeConfig.placeholder}
            disabled={isGenerating}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && prompt.trim() && !isGenerating) {
                onGenerate();
              }
            }}
            style={{
              backgroundColor: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '6px',
              color: '#e6edf3',
              fontSize: '14px',
              lineHeight: '1.5',
              padding: '12px',
              resize: 'none',
              outline: 'none',
              flex: 1,
              minHeight: '140px',
              fontFamily: 'inherit',
              width: '100%',
            }}
          />
          <p style={{ color: '#6e7681', fontSize: '11px', marginTop: '6px' }}>
            <kbd style={{ backgroundColor: '#21262d', border: '1px solid #30363d', borderRadius: '3px', padding: '0 4px', fontSize: '10px' }}>
              ⌘ Enter
            </kbd>
            {' '}to generate
          </p>
        </div>

        {/* Example prompts */}
        <div>
          <button
            onClick={() => setShowExamples(!showExamples)}
            style={{ color: '#58a6ff', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
          >
            {showExamples ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Example prompts
          </button>

          {showExamples && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {EXAMPLE_PROMPTS[type].map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { onPromptChange(ex); setShowExamples(false); }}
                  style={{
                    backgroundColor: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#8b949e',
                    fontSize: '12px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    lineHeight: '1.4',
                    transition: 'border-color 0.1s, color 0.1s',
                  }}
                  className="hover:border-[#58a6ff] hover:text-[#e6edf3]"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '16px', borderTop: '1px solid #30363d', display: 'flex', gap: '8px', flexShrink: 0 }}>
        {hasOutput && (
          <button
            onClick={onReset}
            disabled={isGenerating}
            className="btn btn-secondary"
            style={{ flex: 'none' }}
            title="Clear output"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="btn btn-copilot"
          style={{ flex: 1, justifyContent: 'center', opacity: (!prompt.trim() || isGenerating) ? 0.5 : 1, cursor: (!prompt.trim() || isGenerating) ? 'not-allowed' : 'pointer' }}
        >
          {isGenerating ? (
            <>
              <span
                style={{
                  width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0,
                }}
              />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              {hasOutput ? 'Regenerate' : 'Generate blueprint'}
            </>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
