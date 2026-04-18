'use client';

import { useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, LayoutPanelLeft } from 'lucide-react';
import PromptPanel from '@/components/editor/PromptPanel';
import ArtifactPanel from '@/components/editor/ArtifactPanel';
import { BlueprintType } from '@/lib/types';

function EditorContent() {
  const searchParams  = useSearchParams();
  const initialType   = (searchParams.get('type') as BlueprintType) ?? 'wireframe';

  const [type, setType]               = useState<BlueprintType>(initialType);
  const [prompt, setPrompt]           = useState('');
  const [output, setOutput]           = useState('');
  const [isGenerating, setGenerating] = useState(false);
  const [error, setError]             = useState('');
  const abortRef                      = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setGenerating(true);
    setOutput('');
    setError('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(msg);
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message);
      }
    } finally {
      setGenerating(false);
    }
  }, [prompt, type, isGenerating]);

  const handleTypeChange = useCallback((newType: BlueprintType) => {
    setType(newType);
    setOutput('');
    setError('');
  }, []);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setOutput('');
    setError('');
    setGenerating(false);
  }, []);

  return (
    <div style={{ backgroundColor: '#0d1117', minHeight: 'calc(100vh - 62px)', display: 'flex', flexDirection: 'column' }}>
      {/* Sub-header */}
      <div style={{ backgroundColor: '#161b22', borderBottom: '1px solid #30363d', padding: '8px 16px', flexShrink: 0 }}>
        <div className="flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1 text-sm text-[#8b949e]">
            <Link href="/" className="text-[#58a6ff] hover:underline">GitHub</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/dashboard" className="text-[#58a6ff] hover:underline">Copilot Blueprint</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#e6edf3]">New blueprint</span>
          </nav>

          <div className="flex items-center gap-2 text-xs text-[#6e7681]">
            <LayoutPanelLeft className="w-3.5 h-3.5" />
            <span>Split view</span>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{ backgroundColor: '#f851491a', border: '1px solid #f8514940', borderRadius: '6px', margin: '12px 16px', padding: '10px 14px', color: '#f85149', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '8px', flexShrink: 0 }}
        >
          <span style={{ flexShrink: 0 }}>⚠</span>
          <span><strong>Generation failed:</strong> {error}</span>
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Split editor pane */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left panel — prompt */}
        <div style={{ width: '360px', flexShrink: 0, minHeight: 0 }}>
          <PromptPanel
            type={type}
            onTypeChange={handleTypeChange}
            prompt={prompt}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            hasOutput={!!output}
            onReset={handleReset}
          />
        </div>

        {/* Right panel — artifact */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <ArtifactPanel
            output={output}
            type={type}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 62px)', color: '#6e7681' }}>
        Loading editor…
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
