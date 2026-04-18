'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Plus, Layout, GitFork, Palette, Code2, Check } from 'lucide-react';
import { BlueprintType, ChatMessage, BLUEPRINT_TYPES } from '@/lib/types';

const TYPE_META: Record<BlueprintType, { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }> = {
  'wireframe':      { icon: Layout,  color: '#58a6ff' },
  'system-diagram': { icon: GitFork, color: '#a371f7' },
  'visual-design':  { icon: Palette, color: '#3fb950' },
  'code-blueprint': { icon: Code2,   color: '#d29922' },
};

interface Props {
  type: BlueprintType;
  onTypeChange: (t: BlueprintType) => void;
  messages: ChatMessage[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onNewBlueprint: () => void;
  isStreaming: boolean;
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: '5px', height: '5px', borderRadius: '50%',
            backgroundColor: '#8b949e',
            animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
            display: 'inline-block',
          }}
        />
      ))}
    </span>
  );
}

function ArtifactBadge({ type }: { type: BlueprintType }) {
  const meta   = TYPE_META[type];
  const config = BLUEPRINT_TYPES.find((t) => t.id === type)!;
  const Icon   = meta.icon;
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        backgroundColor: `${meta.color}15`,
        border: `1px solid ${meta.color}40`,
        borderRadius: '20px', padding: '4px 10px',
        fontSize: '12px', color: meta.color, fontWeight: '500',
      }}
    >
      <Icon className="w-3 h-3" />
      {config.label} generated
      <Check className="w-3 h-3" style={{ color: '#3fb950' }} />
    </div>
  );
}

export default function ChatPanel({
  type, onTypeChange,
  messages, input, onInputChange,
  onSend, onNewBlueprint,
  isStreaming,
}: Props) {
  const threadRef      = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const [typeOpen, setTypeOpen] = useState(messages.length === 0);
  const hasMessages    = messages.length > 0;

  // Auto-scroll to bottom as messages arrive
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Collapse type selector once conversation starts
  useEffect(() => {
    if (hasMessages) setTypeOpen(false);
  }, [hasMessages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (input.trim() && !isStreaming) onSend();
    }
  }

  const currentMeta   = TYPE_META[type];
  const CurrentIcon   = currentMeta.icon;
  const currentConfig = BLUEPRINT_TYPES.find((t) => t.id === type)!;

  return (
    <div
      style={{
        backgroundColor: '#161b22',
        borderRight: '1px solid #30363d',
        display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #30363d', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'linear-gradient(135deg, #8957e5, #1f6feb)', borderRadius: '6px', padding: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span style={{ color: '#e6edf3', fontWeight: '600', fontSize: '13px' }}>Copilot Blueprint</span>
            <span style={{ backgroundColor: '#8957e520', color: '#a371f7', borderRadius: '20px', fontSize: '10px', fontWeight: '600', padding: '1px 6px' }}>
              BETA
            </span>
          </div>
          {hasMessages && (
            <button
              onClick={onNewBlueprint}
              title="New blueprint"
              style={{ background: 'none', border: '1px solid #30363d', borderRadius: '6px', color: '#8b949e', cursor: 'pointer', padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              className="hover:border-[#58a6ff] hover:text-[#58a6ff] transition-colors"
            >
              <Plus className="w-3 h-3" />
              New
            </button>
          )}
        </div>
      </div>

      {/* ── Type selector (collapsible) ── */}
      <div style={{ borderBottom: '1px solid #30363d', flexShrink: 0, overflow: 'hidden' }}>
        <button
          onClick={() => setTypeOpen((o) => !o)}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px',
            color: '#8b949e', fontSize: '12px', textAlign: 'left',
          }}
          className="hover:bg-[#21262d] transition-colors"
        >
          <CurrentIcon style={{ color: currentMeta.color, width: '13px', height: '13px' }} />
          <span style={{ color: currentMeta.color, fontWeight: '600' }}>{currentConfig.label}</span>
          <span style={{ marginLeft: 'auto', fontSize: '10px' }}>{typeOpen ? '▲' : '▼'}</span>
        </button>

        {typeOpen && (
          <div style={{ padding: '6px 10px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {BLUEPRINT_TYPES.map((t) => {
              const meta   = TYPE_META[t.id];
              const Icon   = meta.icon;
              const active = type === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { onTypeChange(t.id); setTypeOpen(false); }}
                  style={{
                    background: active ? `${meta.color}12` : 'transparent',
                    border: `1px solid ${active ? meta.color : '#30363d'}`,
                    borderRadius: '6px', padding: '7px 9px',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.1s',
                  }}
                  className={!active ? 'hover:border-[#484f58]' : ''}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                    <Icon style={{ color: active ? meta.color : '#8b949e', width: '12px', height: '12px' }} />
                    <span style={{ color: active ? meta.color : '#e6edf3', fontSize: '11px', fontWeight: '600' }}>{t.label}</span>
                  </div>
                  <p style={{ color: '#6e7681', fontSize: '10px', lineHeight: '1.3', margin: 0 }}>{t.description}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Message thread ── */}
      <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Empty state */}
        {!hasMessages && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px 16px', gap: '12px', color: '#6e7681' }}>
            <div style={{ background: 'linear-gradient(135deg, #8957e530, #1f6feb30)', borderRadius: '50%', padding: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a371f7" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <p style={{ color: '#e6edf3', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Describe your design</p>
              <p style={{ fontSize: '12px', lineHeight: '1.5', color: '#6e7681', maxWidth: '220px' }}>
                Copilot will ask a few questions, then generate your {currentConfig.label.toLowerCase()}.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          if (isUser) {
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    backgroundColor: '#1f6feb',
                    color: '#ffffff',
                    borderRadius: '12px 12px 2px 12px',
                    padding: '8px 12px',
                    maxWidth: '85%',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          }

          // Assistant message
          return (
            <div key={msg.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              {/* Copilot avatar */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #8957e5, #1f6feb)',
                  borderRadius: '50%', width: '24px', height: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: '2px',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {msg.isArtifact ? (
                  /* Artifact notification bubble */
                  <div
                    style={{
                      backgroundColor: '#0d1117',
                      border: '1px solid #238636',
                      borderRadius: '2px 12px 12px 12px',
                      padding: '10px 12px',
                      display: 'flex', flexDirection: 'column', gap: '8px',
                    }}
                  >
                    <ArtifactBadge type={type} />
                    <p style={{ color: '#8b949e', fontSize: '12px', margin: 0, lineHeight: '1.4' }}>
                      Your {BLUEPRINT_TYPES.find((t) => t.id === type)!.label.toLowerCase()} is ready in the panel →<br />
                      Ask me to make any changes.
                    </p>
                  </div>
                ) : (
                  /* Chat prose bubble */
                  <div
                    style={{
                      backgroundColor: '#21262d',
                      border: '1px solid #30363d',
                      borderRadius: '2px 12px 12px 12px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#e6edf3',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.isStreaming && !msg.content ? <TypingDots /> : msg.content}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Input bar ── */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #30363d', flexShrink: 0 }}>
        <div
          style={{
            backgroundColor: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: '10px',
            display: 'flex', alignItems: 'flex-end', gap: '8px',
            padding: '8px 10px',
            transition: 'border-color 0.1s',
          }}
          onFocus={() => {}} // handled by child
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              onInputChange(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              hasMessages
                ? 'Ask Copilot to make changes…'
                : `Describe the ${currentConfig.label.toLowerCase()} you want to create…`
            }
            disabled={isStreaming}
            rows={1}
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: '#e6edf3', fontSize: '13px', lineHeight: '1.5',
              resize: 'none', flex: 1, fontFamily: 'inherit',
              maxHeight: '120px', overflowY: 'auto',
            }}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || isStreaming}
            style={{
              background: input.trim() && !isStreaming
                ? 'linear-gradient(135deg, #8957e5, #1f6feb)'
                : '#21262d',
              border: 'none', borderRadius: '6px',
              width: '28px', height: '28px', flexShrink: 0,
              cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            {isStreaming ? (
              <span
                style={{
                  width: '10px', height: '10px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite', display: 'inline-block',
                }}
              />
            ) : (
              <Send className="w-3.5 h-3.5" style={{ color: input.trim() ? 'white' : '#6e7681' }} />
            )}
          </button>
        </div>
        <p style={{ color: '#6e7681', fontSize: '11px', marginTop: '5px', textAlign: 'right' }}>
          <kbd style={{ backgroundColor: '#21262d', border: '1px solid #30363d', borderRadius: '3px', padding: '0 4px', fontSize: '10px' }}>⌘ Enter</kbd>
          {' '}to send
        </p>
      </div>

      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
