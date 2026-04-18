'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Plus, Layout, GitFork, Palette, Code2, Search, Clock, ChevronRight, GitBranch, Hash } from 'lucide-react';
import { BlueprintType, BLUEPRINT_TYPES, StoredBlueprint } from '@/lib/types';

const TYPE_ICONS: Record<BlueprintType, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  'wireframe':       Layout,
  'system-diagram':  GitFork,
  'visual-design':   Palette,
  'code-blueprint':  Code2,
};

const TYPE_COLORS: Record<BlueprintType, string> = {
  'wireframe':       '#58a6ff',
  'system-diagram':  '#a371f7',
  'visual-design':   '#3fb950',
  'code-blueprint':  '#d29922',
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)   return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function DashboardPage() {
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState<BlueprintType | 'all'>('all');
  const [blueprints, setBlueprints] = useState<StoredBlueprint[]>([]);
  const [loading, setLoading]       = useState(true);
  const [authed, setAuthed]         = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/github/me').then((r) => r.json()),
      fetch('/api/blueprints').then((r) => r.ok ? r.json() : []),
    ]).then(([me, bps]) => {
      setAuthed(!!me.authenticated);
      setBlueprints(Array.isArray(bps) ? bps : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = blueprints.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || b.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ backgroundColor: '#0d1117', minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{ backgroundColor: '#161b22', borderBottom: '1px solid #30363d' }}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm text-[#8b949e] mb-4">
            <Link href="/" className="text-[#58a6ff] hover:underline flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.034 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z" />
              </svg>
              GitHub
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#e6edf3] font-semibold">Copilot Blueprint</span>
          </nav>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  style={{ background: 'linear-gradient(135deg, #8957e5, #1f6feb)', borderRadius: '8px', padding: '6px' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5Z" />
                  </svg>
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#e6edf3' }}>Copilot Blueprint</h1>
                <span
                  style={{ backgroundColor: '#8957e520', color: '#a371f7', border: '1px solid #8957e540', borderRadius: '20px', fontSize: '11px', fontWeight: '600', padding: '2px 8px' }}
                >
                  BETA
                </span>
              </div>
              <p style={{ color: '#8b949e', fontSize: '14px' }}>
                AI-powered designs, wireframes, and system diagrams — directly in GitHub.
              </p>
            </div>

            <Link href="/editor" className="btn btn-copilot">
              <Plus className="w-4 h-4" />
              New blueprint
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Unauthenticated prompt */}
        {!loading && !authed && (
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: '#e6edf3', fontWeight: '600', marginBottom: '4px' }}>Connect GitHub to save blueprints</p>
              <p style={{ color: '#8b949e', fontSize: '13px' }}>Link your account to persist blueprints, access repo context, and link issues.</p>
            </div>
            <a href="/api/github/auth" style={{ background: 'linear-gradient(135deg, #8957e5, #1f6feb)', borderRadius: '6px', padding: '7px 16px', color: 'white', fontSize: '13px', fontWeight: '500', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Connect GitHub
            </a>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total blueprints', value: String(blueprints.length),                                           color: '#58a6ff' },
            { label: 'Wireframes',       value: String(blueprints.filter((b) => b.type === 'wireframe').length),     color: '#58a6ff' },
            { label: 'System diagrams',  value: String(blueprints.filter((b) => b.type === 'system-diagram').length),color: '#a371f7' },
            { label: 'Visual designs',   value: String(blueprints.filter((b) => b.type === 'visual-design').length), color: '#3fb950' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px' }}
            >
              <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color, lineHeight: '1' }} className="mb-1">
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter + Search bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div
            style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', flex: 1 }}
            className="flex items-center gap-2 px-3 py-2"
          >
            <Search className="w-4 h-4 text-[#8b949e] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search blueprints…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: '#e6edf3', fontSize: '14px', width: '100%' }}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {[{ value: 'all', label: 'All' }, ...BLUEPRINT_TYPES.map((t) => ({ value: t.id, label: t.label }))].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value as BlueprintType | 'all')}
                style={{
                  backgroundColor: filter === opt.value ? '#21262d' : 'transparent',
                  border: `1px solid ${filter === opt.value ? '#58a6ff' : '#30363d'}`,
                  color: filter === opt.value ? '#58a6ff' : '#8b949e',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                  whiteSpace: 'nowrap',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Blueprint grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#8b949e' }}>
            <Search className="w-10 h-10 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-[#e6edf3] mb-2">No blueprints found</p>
            <p className="text-sm mb-6">Try adjusting your search or filter, or create a new blueprint.</p>
            <Link href="/editor" className="btn btn-copilot">
              <Plus className="w-4 h-4" />
              New blueprint
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* New blueprint card */}
            <Link
              href="/editor"
              style={{
                backgroundColor: 'transparent',
                border: '2px dashed #30363d',
                borderRadius: '10px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                minHeight: '180px',
                textDecoration: 'none',
                transition: 'border-color 0.15s',
              }}
              className="hover:border-[#58a6ff] group"
            >
              <div
                style={{ backgroundColor: '#21262d', borderRadius: '50%', padding: '12px' }}
                className="group-hover:bg-[#1f6feb20] transition-colors"
              >
                <Plus className="w-6 h-6 text-[#8b949e] group-hover:text-[#58a6ff] transition-colors" />
              </div>
              <span style={{ color: '#8b949e', fontSize: '14px', fontWeight: '500' }} className="group-hover:text-[#58a6ff] transition-colors">
                New blueprint
              </span>
            </Link>

            {filtered.map((bp) => {
              const Icon       = TYPE_ICONS[bp.type];
              const color      = TYPE_COLORS[bp.type];
              const typeConfig = BLUEPRINT_TYPES.find((t) => t.id === bp.type)!;
              const lines      = bp.output ? bp.output.split('\n').length : 0;
              return (
                <Link
                  key={bp.id}
                  href={`/editor?id=${bp.id}`}
                  style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '20px', display: 'block', textDecoration: 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                  className="hover:border-[#58a6ff] hover:shadow-lg group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div style={{ backgroundColor: `${color}18`, borderRadius: '8px', padding: '8px' }}>
                      <Icon style={{ color }} className="w-4 h-4" />
                    </div>
                    <span style={{ backgroundColor: `${color}18`, color, borderRadius: '20px', fontSize: '10px', fontWeight: '600', padding: '2px 8px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                      {typeConfig.outputLanguage}
                    </span>
                  </div>

                  <h3 style={{ color: '#e6edf3', fontSize: '15px', fontWeight: '600', marginBottom: '6px', lineHeight: '1.3' }} className="group-hover:text-[#58a6ff] transition-colors">
                    {bp.title}
                  </h3>

                  {/* GitHub context chips */}
                  {(bp.repoFullName || bp.issueNumber) && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {bp.repoFullName && !bp.repoFullName.startsWith('user:') && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: '#58a6ff15', border: '1px solid #58a6ff30', borderRadius: '20px', padding: '1px 7px', color: '#58a6ff', fontSize: '10px' }}>
                          <GitBranch className="w-2.5 h-2.5" />{bp.repoFullName}
                        </span>
                      )}
                      {bp.issueNumber && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: '#d2992215', border: '1px solid #d2992230', borderRadius: '20px', padding: '1px 7px', color: '#d29922', fontSize: '10px' }}>
                          <Hash className="w-2.5 h-2.5" />{bp.issueType === 'pr' ? 'PR' : 'Issue'} #{bp.issueNumber}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-[#6e7681]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Updated {relativeTime(bp.updatedAt)}</span>
                    </div>
                    <span>{lines} lines</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
