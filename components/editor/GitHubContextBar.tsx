'use client';

import { useState, useEffect, useCallback } from 'react';
import { GitBranch, Hash, BookOpen, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GitHubContext, GitHubRepo } from '@/lib/types';

interface Props {
  context: GitHubContext | null;
  onContextChange: (ctx: GitHubContext | null) => void;
  isAuthenticated: boolean;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

export default function GitHubContextBar({ context, onContextChange, isAuthenticated }: Props) {
  const [repos, setRepos]           = useState<GitHubRepo[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [repoOpen, setRepoOpen]     = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [branch, setBranch]         = useState('');
  const [issueInput, setIssueInput] = useState('');
  const [loadState, setLoadState]   = useState<LoadState>('idle');
  const [errorMsg, setErrorMsg]     = useState('');

  // Fetch repo list once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/github/repos')
      .then((r) => r.json())
      .then((data: GitHubRepo[]) => setRepos(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isAuthenticated]);

  // Populate form from existing context
  useEffect(() => {
    if (!context) return;
    const repo = repos.find((r) => r.fullName === context.repoFullName);
    if (repo) setSelectedRepo(repo);
    setBranch(context.branch);
    if (context.issueNumber) setIssueInput(`${context.issueType === 'pr' ? '!' : '#'}${context.issueNumber}`);
  }, [context, repos]);

  const filteredRepos = repos.filter((r) =>
    r.fullName.toLowerCase().includes(repoSearch.toLowerCase()),
  );

  const parseIssueInput = (raw: string): { number: number; type: 'issue' | 'pr' } | null => {
    const m = raw.trim().match(/^[!#]?(\d+)$/);
    if (!m) return null;
    return { number: parseInt(m[1], 10), type: raw.trim().startsWith('!') ? 'pr' : 'issue' };
  };

  const handleLoad = useCallback(async () => {
    if (!selectedRepo) return;
    setLoadState('loading');
    setErrorMsg('');

    try {
      const b = branch || selectedRepo.defaultBranch;

      // Fetch repo context
      const repoRes = await fetch(
        `/api/github/repo-context?repo=${encodeURIComponent(selectedRepo.fullName)}&branch=${encodeURIComponent(b)}`,
      );
      if (!repoRes.ok) throw new Error((await repoRes.json()).error);
      const { text: repoText } = await repoRes.json() as { text: string };

      // Fetch issue/PR context if provided
      let issueText: string | undefined;
      let issueNumber: number | undefined;
      let issueType: 'issue' | 'pr' | undefined;

      const parsed = parseIssueInput(issueInput);
      if (parsed) {
        const issueRes = await fetch(
          `/api/github/issue?repo=${encodeURIComponent(selectedRepo.fullName)}&number=${parsed.number}&type=${parsed.type}`,
        );
        if (!issueRes.ok) throw new Error((await issueRes.json()).error);
        const data = await issueRes.json() as { text: string };
        issueText   = data.text;
        issueNumber = parsed.number;
        issueType   = parsed.type;
      }

      onContextChange({
        repoFullName: selectedRepo.fullName,
        branch:       b,
        issueNumber,
        issueType,
        repoText,
        issueText,
      });
      setLoadState('loaded');
    } catch (err) {
      setErrorMsg((err as Error).message);
      setLoadState('error');
    }
  }, [selectedRepo, branch, issueInput, onContextChange]);

  if (!isAuthenticated) return null;

  // ── Compact chips view when context is loaded ─────────────────────────────
  if (context && loadState !== 'loading') {
    return (
      <div
        style={{
          backgroundColor: '#0d1117',
          borderBottom: '1px solid #30363d',
          padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        <CheckCircle2 className="w-3 h-3 text-[#3fb950] flex-shrink-0" />

        {/* Repo chip */}
        <Chip color="#58a6ff" icon={<BookOpen className="w-3 h-3" />} label={context.repoFullName} />

        {/* Branch chip */}
        <Chip color="#8b949e" icon={<GitBranch className="w-3 h-3" />} label={context.branch} />

        {/* Issue/PR chip */}
        {context.issueNumber && (
          <Chip
            color={context.issueType === 'pr' ? '#a371f7' : '#d29922'}
            icon={<Hash className="w-3 h-3" />}
            label={`${context.issueType === 'pr' ? 'PR' : 'Issue'} #${context.issueNumber}`}
          />
        )}

        <button
          onClick={() => { onContextChange(null); setLoadState('idle'); setSelectedRepo(null); setBranch(''); setIssueInput(''); }}
          title="Clear GitHub context"
          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6e7681', cursor: 'pointer', padding: '2px', display: 'flex' }}
          className="hover:text-[#f85149] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // ── Expanded form ─────────────────────────────────────────────────────────
  return (
    <div
      style={{
        backgroundColor: '#0d1117',
        borderBottom: '1px solid #30363d',
        padding: '10px 14px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        flexShrink: 0,
      }}
    >
      <p style={{ color: '#8b949e', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        GitHub Context
      </p>

      {/* Repo selector */}
      <div style={{ position: 'relative' }}>
        <input
          value={selectedRepo ? selectedRepo.fullName : repoSearch}
          onFocus={() => { setRepoOpen(true); if (selectedRepo) { setRepoSearch(''); } }}
          onBlur={() => setTimeout(() => setRepoOpen(false), 150)}
          onChange={(e) => { setRepoSearch(e.target.value); setSelectedRepo(null); }}
          placeholder="Select repository…"
          style={{
            width: '100%', backgroundColor: '#161b22', border: '1px solid #30363d',
            borderRadius: '6px', color: '#e6edf3', fontSize: '12px',
            padding: '5px 10px', outline: 'none', fontFamily: 'inherit',
          }}
        />
        {repoOpen && filteredRepos.length > 0 && (
          <div
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              backgroundColor: '#161b22', border: '1px solid #30363d',
              borderRadius: '6px', maxHeight: '180px', overflowY: 'auto',
              marginTop: '2px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            {filteredRepos.slice(0, 20).map((r) => (
              <button
                key={r.fullName}
                onMouseDown={() => { setSelectedRepo(r); setBranch(r.defaultBranch); setRepoOpen(false); setRepoSearch(''); }}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  padding: '7px 10px', cursor: 'pointer', color: '#e6edf3', fontSize: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                }}
                className="hover:bg-[#21262d]"
              >
                <span>{r.fullName}</span>
                {r.language && <span style={{ color: '#6e7681', fontSize: '11px', flexShrink: 0 }}>{r.language}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        {/* Branch */}
        <div style={{ flex: 1, position: 'relative' }}>
          <GitBranch className="w-3 h-3" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#6e7681' }} />
          <input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder={selectedRepo?.defaultBranch ?? 'Branch'}
            style={{
              width: '100%', backgroundColor: '#161b22', border: '1px solid #30363d',
              borderRadius: '6px', color: '#e6edf3', fontSize: '12px',
              padding: '5px 8px 5px 24px', outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Issue / PR */}
        <div style={{ width: '90px', position: 'relative' }}>
          <Hash className="w-3 h-3" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#6e7681' }} />
          <input
            value={issueInput}
            onChange={(e) => setIssueInput(e.target.value)}
            placeholder="#123"
            style={{
              width: '100%', backgroundColor: '#161b22', border: '1px solid #30363d',
              borderRadius: '6px', color: '#e6edf3', fontSize: '12px',
              padding: '5px 8px 5px 22px', outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f85149', fontSize: '11px' }}>
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <button
        onClick={handleLoad}
        disabled={!selectedRepo || loadState === 'loading'}
        style={{
          background: selectedRepo ? 'linear-gradient(135deg, #238636, #2ea043)' : '#21262d',
          border: 'none', borderRadius: '6px', color: selectedRepo ? 'white' : '#6e7681',
          fontSize: '12px', fontWeight: '500', padding: '5px 12px',
          cursor: selectedRepo ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          transition: 'background 0.1s',
        }}
      >
        {loadState === 'loading' ? (
          <><Loader2 className="w-3 h-3 animate-spin" />Fetching context…</>
        ) : (
          'Load context'
        )}
      </button>
    </div>
  );
}

function Chip({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        backgroundColor: `${color}15`, border: `1px solid ${color}40`,
        borderRadius: '20px', padding: '2px 8px',
        color, fontSize: '11px', fontWeight: '500', maxWidth: '180px',
      }}
    >
      {icon}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </span>
  );
}
