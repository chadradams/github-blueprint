'use client';

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, LayoutPanelLeft, Save } from 'lucide-react';
import ChatPanel from '@/components/editor/ChatPanel';
import ArtifactPanel from '@/components/editor/ArtifactPanel';
import GitHubContextBar from '@/components/editor/GitHubContextBar';
import { BlueprintType, ChatMessage, GitHubContext, ARTIFACT_MARKER } from '@/lib/types';

function uid() { return Math.random().toString(36).slice(2, 10); }

function EditorContent() {
  const searchParams = useSearchParams();
  const initialType  = (searchParams.get('type') as BlueprintType) ?? 'wireframe';

  const [type, setType]               = useState<BlueprintType>(initialType);
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [input, setInput]             = useState('');
  const [output, setOutput]           = useState('');
  const [isStreaming, setStreaming]    = useState(false);
  const [error, setError]             = useState('');
  const [isAuthenticated, setAuthed]  = useState(false);
  const [githubContext, setContext]    = useState<GitHubContext | null>(null);
  const [saving, setSaving]           = useState(false);
  const abortRef                      = useRef<AbortController | null>(null);

  // Check auth state on mount
  useEffect(() => {
    fetch('/api/github/me')
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.authenticated))
      .catch(() => {});
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const userMsg: ChatMessage     = { id: uid(), role: 'user', content: text };
    const nextMessages             = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setStreaming(true);

    const assistantId = uid();
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', isStreaming: true }]);

    try {
      const res = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:       nextMessages.map(({ role, content }) => ({ role, content })),
          type,
          currentArtifact: output || undefined,
          githubContext:   githubContext ?? undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(msg);
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();

      let accumulated  = '';
      let responseType: 'chat' | 'artifact' | null = null;

      const updateAssistant = (patch: Partial<ChatMessage>) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)));

      while (true) {
        const { done, value } = await reader.read();
        accumulated += decoder.decode(value ?? new Uint8Array(), { stream: !done });

        if (responseType === null && (accumulated.length >= ARTIFACT_MARKER.length || done)) {
          responseType = accumulated.startsWith(ARTIFACT_MARKER) ? 'artifact' : 'chat';
          if (responseType === 'artifact') {
            accumulated = accumulated.slice(ARTIFACT_MARKER.length);
            updateAssistant({ content: '', isArtifact: true, isStreaming: true });
            setOutput('');
          }
        }

        if (responseType === 'artifact')      setOutput(accumulated);
        else if (responseType === 'chat')     updateAssistant({ content: accumulated });

        if (done) break;
      }

      if (responseType === 'artifact') updateAssistant({ isStreaming: false, isArtifact: true, content: accumulated });
      else                             updateAssistant({ isStreaming: false, content: accumulated });
    } catch (err) {
      const isAbort = (err as Error).name === 'AbortError';
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      if (!isAbort) setError((err as Error).message);
    } finally {
      setStreaming(false);
    }
  }, [input, messages, type, output, githubContext, isStreaming]);

  const handleSave = useCallback(async () => {
    if (!output || saving) return;
    setSaving(true);
    try {
      await fetch('/api/blueprints', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, output, messages,
          repoFullName: githubContext?.repoFullName,
          branch:       githubContext?.branch,
          issueNumber:  githubContext?.issueNumber,
          issueType:    githubContext?.issueType,
        }),
      });
    } catch { /* non-fatal */ } finally {
      setSaving(false);
    }
  }, [output, saving, type, messages, githubContext]);

  const handleNewBlueprint = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]); setOutput(''); setInput(''); setError(''); setStreaming(false);
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
          <div className="flex items-center gap-3">
            {output && isAuthenticated && (
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid #30363d', borderRadius: '6px', color: '#8b949e', cursor: 'pointer', padding: '3px 10px', fontSize: '12px' }}
                className="hover:border-[#3fb950] hover:text-[#3fb950] transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save blueprint'}
              </button>
            )}
            <div className="flex items-center gap-2 text-xs text-[#6e7681]">
              <LayoutPanelLeft className="w-3.5 h-3.5" />
              <span>Split view</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#f851491a', border: '1px solid #f8514940', borderRadius: '6px', margin: '10px 16px', padding: '10px 14px', color: '#f85149', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '8px', flexShrink: 0 }}>
          <span style={{ flexShrink: 0 }}>⚠</span>
          <span><strong>Error:</strong> {error}</span>
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>×</button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left — chat + context bar */}
        <div style={{ width: '360px', flexShrink: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <GitHubContextBar
            context={githubContext}
            onContextChange={setContext}
            isAuthenticated={isAuthenticated}
          />
          <div style={{ flex: 1, minHeight: 0 }}>
            <ChatPanel
              type={type}
              onTypeChange={setType}
              messages={messages}
              input={input}
              onInputChange={setInput}
              onSend={handleSend}
              onNewBlueprint={handleNewBlueprint}
              isStreaming={isStreaming}
            />
          </div>
        </div>

        {/* Right — artifact */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <ArtifactPanel output={output} type={type} isGenerating={isStreaming && !!output} />
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 62px)', color: '#6e7681' }}>Loading editor…</div>}>
      <EditorContent />
    </Suspense>
  );
}
