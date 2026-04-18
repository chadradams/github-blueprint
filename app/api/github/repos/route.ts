import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listRepos } from '@/lib/github';
import { GitHubRepo } from '@/lib/types';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const raw   = await listRepos(session.token);
    const repos: GitHubRepo[] = raw.map((r) => ({
      fullName:      r.full_name,
      name:          r.name,
      description:   r.description,
      defaultBranch: r.default_branch,
      language:      r.language,
      private:       r.private,
    }));
    return NextResponse.json(repos);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
