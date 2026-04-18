import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { buildIssueContextText } from '@/lib/github';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const repo   = searchParams.get('repo');
  const number = parseInt(searchParams.get('number') ?? '', 10);
  const type   = (searchParams.get('type') ?? 'issue') as 'issue' | 'pr';

  if (!repo || isNaN(number)) {
    return NextResponse.json({ error: 'repo and number params required' }, { status: 400 });
  }

  const [owner, name] = repo.split('/');
  if (!owner || !name) return NextResponse.json({ error: 'repo must be owner/repo' }, { status: 400 });

  try {
    const text = await buildIssueContextText(session.token, owner, name, number, type);
    return NextResponse.json({ text, type });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
