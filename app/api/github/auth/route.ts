import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'GITHUB_CLIENT_ID is not configured' }, { status: 500 });
  }

  const origin      = new URL(request.url).origin;
  const callbackUrl = `${origin}/api/github/callback`;
  const state       = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id:    clientId,
    redirect_uri: callbackUrl,
    scope:        'repo read:org read:user',
    state,
  });

  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params}`,
  );
  // Store state in a short-lived cookie for CSRF validation
  response.cookies.set('gh_oauth_state', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   600,
    path:     '/',
  });
  return response;
}
