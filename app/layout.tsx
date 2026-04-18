import type { Metadata } from 'next'
import './globals.css'
import GitHubNav from '@/components/GitHubNav'

export const metadata: Metadata = {
  title: 'Copilot Blueprint · GitHub',
  description: 'AI-powered UI wireframes, system diagrams, visual designs, and code blueprints — built into GitHub.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GitHubNav />
        {children}
      </body>
    </html>
  )
}
