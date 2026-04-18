'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Plus, ChevronDown, Search } from 'lucide-react';

interface Session { login: string; avatarUrl: string }

export default function GitHubNav() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch('/api/github/me')
      .then((r) => r.json())
      .then((d) => { if (d.authenticated) setSession({ login: d.login, avatarUrl: d.avatarUrl }); })
      .catch(() => {});
  }, []);

  return (
    <header
      style={{ backgroundColor: '#161b22', borderBottom: '1px solid #30363d' }}
      className="h-[62px] flex items-center px-4 sticky top-0 z-50 gap-4"
    >
      {/* GitHub logo */}
      <Link href="/" className="flex-shrink-0 text-white hover:text-[#8b949e] transition-colors">
        <svg height="32" viewBox="0 0 24 24" width="32" fill="currentColor" aria-label="GitHub">
          <path d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.034 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z" />
        </svg>
      </Link>

      {/* Search */}
      <div
        style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 w-64 cursor-text text-[#8b949e] text-sm hover:border-[#58a6ff] transition-colors"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span>Search or jump to…</span>
        <div className="ml-auto">
          <kbd style={{ backgroundColor: '#21262d', border: '1px solid #30363d', borderRadius: '4px', padding: '1px 5px', fontSize: '11px' }}>/</kbd>
        </div>
      </div>

      {/* Nav links */}
      <nav className="hidden lg:flex items-center gap-1">
        {['Pull requests', 'Issues', 'Marketplace', 'Explore'].map((item) => (
          <Link key={item} href="#" className="text-[#e6edf3] text-sm px-2 py-1 rounded-md hover:bg-[#30363d] transition-colors whitespace-nowrap">
            {item}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-1">
        <button style={{ border: '1px solid #30363d', borderRadius: '6px' }} className="hidden sm:flex items-center gap-1 text-[#e6edf3] text-sm px-2 py-1 hover:bg-[#21262d] transition-colors">
          <Plus className="w-4 h-4" />
          <ChevronDown className="w-3 h-3 text-[#8b949e]" />
        </button>

        <button className="relative p-2 text-[#e6edf3] hover:bg-[#21262d] rounded-md transition-colors">
          <Bell className="w-4 h-4" />
          <span style={{ backgroundColor: '#1f6feb', border: '2px solid #161b22' }} className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" />
        </button>

        {session ? (
          /* Authenticated — real avatar + login */
          <div className="flex items-center gap-2 ml-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={session.avatarUrl}
              alt={session.login}
              width={32} height={32}
              style={{ borderRadius: '50%', border: '2px solid #30363d' }}
            />
          </div>
        ) : (
          /* Unauthenticated — Connect GitHub */
          <Link
            href="/api/github/auth"
            style={{
              background: 'linear-gradient(135deg, #8957e5, #1f6feb)',
              borderRadius: '6px', padding: '4px 12px',
              color: 'white', fontSize: '12px', fontWeight: '500',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
              marginLeft: '4px', whiteSpace: 'nowrap',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.034 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z" />
            </svg>
            Connect GitHub
          </Link>
        )}
      </div>
    </header>
  );
}
