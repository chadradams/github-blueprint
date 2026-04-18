import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { buildRepoContextText } from '@/lib/github';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const repo   = searchParams.get('repo');   // "owner/repo"
  const branch = searchParams.get('branch') ?? 'HEAD';

  if (!repo) return NextResponse.json({ error: 'repo param required' }, { status: 400 });

  const [owner, name] = repo.split('/');
  if (!owner || !name) return NextResponse.json({ error: 'repo must be owner/repo' }, { status: 400 });

  try {
    const text = await buildRepoContextText(session.token, owner, name, branch);
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
