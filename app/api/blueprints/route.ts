import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listBlueprints, createBlueprint } from '@/lib/cosmos';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const repo = new URL(request.url).searchParams.get('repo') ?? undefined;
  const blueprints = await listBlueprints(session.login, repo);
  return NextResponse.json(blueprints);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { type, title, messages, output, repoFullName, branch, issueNumber, issueType } = body;

  if (!type || !output) {
    return NextResponse.json({ error: 'type and output are required' }, { status: 400 });
  }

  try {
    const blueprint = await createBlueprint({
      type,
      title:       title ?? `${type} — ${new Date().toLocaleDateString()}`,
      messages:    messages ?? [],
      output,
      repoFullName,
      branch,
      issueNumber,
      issueType,
      createdBy:   session.login,
    });
    return NextResponse.json(blueprint, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
