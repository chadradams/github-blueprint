import Link from 'next/link';
import { ArrowRight, Layout, GitFork, Palette, Code2, Zap, Shield, GitBranch, Star } from 'lucide-react';

const features = [
  {
    icon: Layout,
    title: 'UI Wireframes',
    description: 'Generate low-fidelity page and component layouts from natural language. Rapidly prototype ideas before writing a single line of code.',
    color: '#58a6ff',
    tag: 'HTML',
  },
  {
    icon: GitFork,
    title: 'System Diagrams',
    description: 'Create architecture diagrams, ERDs, sequence diagrams, and flowcharts. Visualize how your systems connect and communicate.',
    color: '#a371f7',
    tag: 'Mermaid',
  },
  {
    icon: Palette,
    title: 'Visual Designs',
    description: 'Produce high-fidelity, GitHub-themed UI mockups that match Primer design system conventions. Share with your team immediately.',
    color: '#3fb950',
    tag: 'HTML + CSS',
  },
  {
    icon: Code2,
    title: 'Code Blueprints',
    description: 'Generate structured code architecture plans with file trees, TypeScript interfaces, and module skeletons. Start new projects right.',
    color: '#d29922',
    tag: 'TypeScript',
  },
];

const highlights = [
  {
    icon: Zap,
    title: 'Instant generation',
    description: 'Streaming responses powered by Azure AI Foundry deliver designs in seconds, not minutes.',
  },
  {
    icon: GitBranch,
    title: 'Native to your workflow',
    description: 'Lives inside GitHub. Reference issues, PRs, and code directly in your prompts.',
  },
  {
    icon: Shield,
    title: 'Enterprise-ready',
    description: 'Runs on your Azure tenant. Your prompts and outputs never leave your organization.',
  },
  {
    icon: Star,
    title: 'Primer-accurate',
    description: 'Visual designs automatically apply GitHub\'s design system tokens and component patterns.',
  },
];

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: '#0d1117', minHeight: '100vh' }}>
      {/* Feature announcement banner */}
      <div
        style={{ backgroundColor: '#161b22', borderBottom: '1px solid #30363d' }}
        className="px-6 py-2 text-center text-sm text-[#8b949e]"
      >
        <span
          style={{ backgroundColor: '#8957e5', color: 'white', borderRadius: '12px', fontSize: '11px', fontWeight: '600', padding: '2px 8px' }}
          className="mr-2"
        >
          BETA
        </span>
        Copilot Blueprint is in public beta.{' '}
        <Link href="#" className="text-[#58a6ff] hover:underline">
          Share feedback ↗
        </Link>
      </div>

      {/* Hero */}
      <section className="px-6 py-20 max-w-5xl mx-auto text-center">
        {/* Copilot icon */}
        <div className="flex justify-center mb-8">
          <div
            style={{
              background: 'linear-gradient(135deg, #8957e5 0%, #1f6feb 100%)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 0 40px rgba(139, 87, 229, 0.4)',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5Z" />
              <path d="M12 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM7 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM17 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
            </svg>
          </div>
        </div>

        <div
          style={{ border: '1px solid #30363d', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', marginBottom: '24px', backgroundColor: '#161b22' }}
        >
          <span style={{ color: '#a371f7', fontSize: '12px' }}>✦</span>
          <span style={{ color: '#8b949e', fontSize: '13px' }}>Powered by Azure AI Foundry</span>
        </div>

        <h1
          style={{ fontSize: '56px', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-1px', marginBottom: '24px', color: '#e6edf3' }}
        >
          Design at the speed<br />
          <span className="copilot-gradient">of thought</span>
        </h1>

        <p
          style={{ fontSize: '20px', color: '#8b949e', maxWidth: '640px', margin: '0 auto 40px', lineHeight: '1.6' }}
        >
          Copilot Blueprint generates wireframes, system diagrams, visual designs, and code blueprints directly in GitHub — from a single prompt.
        </p>

        <div className="flex justify-center gap-3 flex-wrap">
          <Link href="/editor" className="btn btn-copilot text-base px-6 py-2.5">
            Start designing
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/dashboard" className="btn btn-secondary text-base px-6 py-2.5">
            View blueprints
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-sm text-[#6e7681]">
          Used by teams at GitHub, Microsoft, and thousands of open-source projects
        </p>
      </section>

      {/* Feature cards */}
      <section style={{ borderTop: '1px solid #21262d' }} className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#e6edf3', marginBottom: '12px' }}>
            Four ways to blueprint your ideas
          </h2>
          <p style={{ color: '#8b949e', fontSize: '16px' }}>
            Describe what you need in plain language. Get production-ready artifacts instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                href={`/editor?type=${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  backgroundColor: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'block',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  textDecoration: 'none',
                }}
                className="hover:border-[#58a6ff] hover:shadow-lg group"
              >
                <div className="flex items-start gap-4">
                  <div
                    style={{ backgroundColor: `${feature.color}15`, borderRadius: '8px', padding: '10px' }}
                    className="flex-shrink-0"
                  >
                    <Icon style={{ color: feature.color }} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 style={{ color: '#e6edf3', fontSize: '16px', fontWeight: '600' }}>{feature.title}</h3>
                      <span
                        style={{
                          backgroundColor: `${feature.color}20`,
                          color: feature.color,
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '1px 8px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {feature.tag}
                      </span>
                    </div>
                    <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: '1.6' }}>{feature.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section style={{ borderTop: '1px solid #21262d', backgroundColor: '#161b22' }} className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#e6edf3', marginBottom: '12px' }}>
              How Copilot Blueprint works
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-0 relative">
            {[
              { step: '01', title: 'Choose a blueprint type', body: 'Select wireframe, system diagram, visual design, or code blueprint — each generates a different kind of artifact.' },
              { step: '02', title: 'Describe your design', body: 'Write a prompt in plain language. Be as detailed or as brief as you like — Copilot fills in the gaps.' },
              { step: '03', title: 'Get your artifact', body: 'Copilot streams the result back in seconds. Edit the code, preview the output, copy or download to use anywhere.' },
            ].map((step, i) => (
              <div key={step.step} className="flex-1 relative">
                {i < 2 && (
                  <div
                    style={{ position: 'absolute', top: '20px', right: '-1px', width: '2px', height: '40px', background: 'linear-gradient(to bottom, #8957e5, transparent)' }}
                    className="hidden md:block"
                  />
                )}
                <div style={{ padding: '24px 32px' }}>
                  <div
                    style={{ color: '#8957e5', fontSize: '48px', fontWeight: '800', lineHeight: '1', fontFamily: 'monospace', marginBottom: '12px', opacity: 0.6 }}
                  >
                    {step.step}
                  </div>
                  <h3 style={{ color: '#e6edf3', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{step.title}</h3>
                  <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: '1.6' }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights grid */}
      <section style={{ borderTop: '1px solid #21262d' }} className="px-6 py-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((h) => {
            const Icon = h.icon;
            return (
              <div key={h.title}>
                <div
                  style={{ backgroundColor: '#21262d', borderRadius: '8px', padding: '8px', width: '36px', height: '36px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon className="w-4 h-4 text-[#a371f7]" />
                </div>
                <h3 style={{ color: '#e6edf3', fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>{h.title}</h3>
                <p style={{ color: '#8b949e', fontSize: '13px', lineHeight: '1.6' }}>{h.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{ borderTop: '1px solid #21262d', background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)' }}
        className="px-6 py-20 text-center"
      >
        <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#e6edf3', marginBottom: '16px' }}>
          Ready to blueprint your next idea?
        </h2>
        <p style={{ color: '#8b949e', fontSize: '16px', marginBottom: '32px' }}>
          No setup required. Start from a blank canvas or one of our example prompts.
        </p>
        <Link href="/editor" className="btn btn-copilot text-base px-8 py-3">
          Open Copilot Blueprint
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #21262d', backgroundColor: '#161b22' }} className="px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#6e7681]">
          <div className="flex items-center gap-2">
            <svg height="20" viewBox="0 0 24 24" width="20" fill="currentColor" className="text-[#6e7681]">
              <path d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.034 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z" />
            </svg>
            <span>© 2026 GitHub, Inc.</span>
          </div>
          <div className="flex gap-6">
            {['Terms', 'Privacy', 'Security', 'Status', 'Docs', 'Contact'].map((link) => (
              <Link key={link} href="#" className="hover:text-[#e6edf3] transition-colors">
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
