'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Copy, Download, Eye, Code, Check, ExternalLink } from 'lucide-react';
import { BlueprintType, BLUEPRINT_TYPES } from '@/lib/types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6e7681', fontSize: '13px' }}>
      Loading editor…
    </div>
  ),
});

interface Props {
  output: string;
  type: BlueprintType;
  isGenerating: boolean;
  title?: string;
}

type Tab = 'code' | 'preview';

export default function ArtifactPanel({ output, type, isGenerating, title }: Props) {
  const [tab, setTab]           = useState<Tab>('code');
  const [copied, setCopied]     = useState(false);
  const mermaidRef              = useRef<HTMLDivElement>(null);
  const typeConfig              = BLUEPRINT_TYPES.find((t) => t.id === type)!;
  const canPreview              = typeConfig.previewMode !== 'code';

  const language = typeConfig.outputLanguage === 'mermaid' ? 'plaintext' : typeConfig.outputLanguage;

  // Render mermaid when preview tab is active
  useEffect(() => {
    if (tab !== 'preview' || typeConfig.previewMode !== 'mermaid' || !output || !mermaidRef.current) return;

    let cancelled = false;
    (async () => {
      const { default: mermaid } = await import('mermaid');
      mermaid.initialize({ startOnLoad: false, theme: 'dark', themeVariables: { darkMode: true, background: '#0d1117', primaryColor: '#a371f7', lineColor: '#8b949e' } });
      try {
        const { svg } = await mermaid.render('mermaid-diagram', output);
        if (!cancelled && mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled && mermaidRef.current) {
          mermaidRef.current.innerHTML = `<p style="color:#f85149;padding:16px;font-size:13px;">Diagram render error — switch to Code tab to review the Mermaid syntax.</p>`;
        }
      }
    })();

    return () => { cancelled = true; };
  }, [tab, output, typeConfig.previewMode]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = useCallback(() => {
    const ext = { html: 'html', mermaid: 'mmd', typescript: 'ts', javascript: 'js' }[typeConfig.outputLanguage] ?? 'txt';
    const blob = new Blob([output], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `blueprint.${ext}` });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output, typeConfig.outputLanguage]);

  const handleOpenPreview = useCallback(() => {
    const blob = new Blob([output], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [output]);

  const isEmpty = !output && !isGenerating;

  return (
    <div style={{ backgroundColor: '#0d1117', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div
        style={{
          backgroundColor: '#161b22',
          borderBottom: '1px solid #30363d',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          flexShrink: 0,
          gap: '4px',
          minHeight: '42px',
        }}
      >
        {/* File tab */}
        <div
          style={{
            backgroundColor: tab === 'code' ? '#0d1117' : 'transparent',
            border: '1px solid',
            borderColor: tab === 'code' ? '#30363d' : 'transparent',
            borderBottom: tab === 'code' ? '1px solid #0d1117' : '1px solid transparent',
            borderRadius: '6px 6px 0 0',
            padding: '6px 14px',
            fontSize: '12px',
            color: tab === 'code' ? '#e6edf3' : '#8b949e',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            userSelect: 'none',
            marginBottom: '-1px',
          }}
          onClick={() => setTab('code')}
        >
          <Code className="w-3.5 h-3.5" />
          {title || (typeConfig.outputLanguage === 'mermaid' ? 'diagram.mmd' : typeConfig.outputLanguage === 'html' ? 'design.html' : 'blueprint.ts')}
          {isGenerating && (
            <span
              style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d29922', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }}
            />
          )}
        </div>

        {canPreview && (
          <div
            style={{
              backgroundColor: tab === 'preview' ? '#0d1117' : 'transparent',
              border: '1px solid',
              borderColor: tab === 'preview' ? '#30363d' : 'transparent',
              borderBottom: tab === 'preview' ? '1px solid #0d1117' : '1px solid transparent',
              borderRadius: '6px 6px 0 0',
              padding: '6px 14px',
              fontSize: '12px',
              color: tab === 'preview' ? '#e6edf3' : '#8b949e',
              cursor: output ? 'pointer' : 'not-allowed',
              opacity: output ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              userSelect: 'none',
              marginBottom: '-1px',
            }}
            onClick={() => output && setTab('preview')}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Action buttons */}
        {output && (
          <>
            {typeConfig.previewMode === 'html' && tab === 'preview' && (
              <button
                onClick={handleOpenPreview}
                title="Open in new tab"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e', padding: '4px', display: 'flex', alignItems: 'center' }}
                className="hover:text-[#e6edf3] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleDownload}
              title="Download"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e', padding: '4px', display: 'flex', alignItems: 'center' }}
              className="hover:text-[#e6edf3] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#3fb950' : '#8b949e', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              className="hover:text-[#e6edf3] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </>
        )}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {isEmpty && (
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: '#6e7681', gap: '12px', padding: '32px',
            }}
          >
            <div
              style={{ background: 'linear-gradient(135deg, #8957e530, #1f6feb30)', borderRadius: '50%', padding: '20px' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a371f7" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#e6edf3', fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>
                Your blueprint will appear here
              </p>
              <p style={{ color: '#6e7681', fontSize: '13px', maxWidth: '320px', lineHeight: '1.5' }}>
                Describe what you want to design on the left, then click <strong style={{ color: '#8b949e' }}>Generate blueprint</strong> to create your artifact.
              </p>
            </div>
          </div>
        )}

        {/* Code tab (Monaco) */}
        <div style={{ height: '100%', display: tab === 'code' ? 'block' : 'none' }}>
          <MonacoEditor
            height="100%"
            language={language}
            value={isGenerating && !output ? '// Generating…' : output}
            options={{
              readOnly: isGenerating,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              fontSize: 13,
              lineHeight: 20,
              fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: 'gutter',
              smoothScrolling: true,
              cursorSmoothCaretAnimation: 'on',
              scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
            }}
            theme="github-dark"
            beforeMount={(monaco) => {
              monaco.editor.defineTheme('github-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                  { token: 'comment',          foreground: '8b949e', fontStyle: 'italic' },
                  { token: 'keyword',           foreground: 'ff7b72' },
                  { token: 'string',            foreground: 'a5d6ff' },
                  { token: 'number',            foreground: '79c0ff' },
                  { token: 'type',              foreground: 'ffa657' },
                  { token: 'class',             foreground: 'ffa657' },
                  { token: 'function',          foreground: 'd2a8ff' },
                  { token: 'variable',          foreground: 'ffa657' },
                  { token: 'tag',               foreground: '7ee787' },
                  { token: 'attribute.name',    foreground: 'e3b341' },
                  { token: 'attribute.value',   foreground: 'a5d6ff' },
                  { token: 'delimiter',         foreground: 'c9d1d9' },
                ],
                colors: {
                  'editor.background':              '#0d1117',
                  'editor.foreground':              '#e6edf3',
                  'editor.lineHighlightBackground': '#161b2280',
                  'editor.selectionBackground':     '#264f7880',
                  'editorCursor.foreground':        '#e6edf3',
                  'editorLineNumber.foreground':    '#6e7681',
                  'editorLineNumber.activeForeground': '#e6edf3',
                  'editor.inactiveSelectionBackground': '#264f7840',
                  'editorWidget.background':        '#161b22',
                  'editorWidget.border':            '#30363d',
                  'editorSuggestWidget.background': '#161b22',
                  'editorSuggestWidget.border':     '#30363d',
                  'scrollbar.shadow':               '#00000000',
                  'scrollbarSlider.background':     '#30363d80',
                  'scrollbarSlider.hoverBackground':'#484f5880',
                },
              });
            }}
          />
        </div>

        {/* Preview tab */}
        {tab === 'preview' && output && (
          <div style={{ height: '100%', overflow: 'hidden' }}>
            {typeConfig.previewMode === 'html' && (
              <iframe
                srcDoc={output}
                sandbox="allow-scripts allow-same-origin"
                style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white' }}
                title="Blueprint preview"
              />
            )}
            {typeConfig.previewMode === 'mermaid' && (
              <div
                style={{ padding: '32px', overflowY: 'auto', height: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}
              >
                <div
                  ref={mermaidRef}
                  style={{ maxWidth: '100%', color: '#e6edf3' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
