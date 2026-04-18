import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getBlueprint, updateBlueprint, deleteBlueprint } from '@/lib/cosmos';

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const repo      = new URL(_req.url).searchParams.get('repo') ?? `user:${session.login}`;
  const blueprint = await getBlueprint(params.id, repo);
  if (!blueprint) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (blueprint.createdBy !== session.login) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(blueprint);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const repo = new URL(request.url).searchParams.get('repo') ?? `user:${session.login}`;

  const existing = await getBlueprint(params.id, repo);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.createdBy !== session.login) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const updated = await updateBlueprint(params.id, repo, body);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const repo = new URL(request.url).searchParams.get('repo') ?? `user:${session.login}`;

  const existing = await getBlueprint(params.id, repo);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.createdBy !== session.login) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await deleteBlueprint(params.id, repo);
  return new NextResponse(null, { status: 204 });
}
