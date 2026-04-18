import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getAuthenticatedUser } from '@/lib/github';
import { createSessionToken, cookieOptions, SESSION_COOKIE } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');

  const storedState = request.cookies.get('gh_oauth_state')?.value;
  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${origin}/dashboard?error=oauth_failed`);
  }

  try {
    const accessToken = await exchangeCodeForToken(code);
    const user        = await getAuthenticatedUser(accessToken);

    const jwt = await createSessionToken({
      token:     accessToken,
      login:     user.login,
      avatarUrl: user.avatar_url,
    });

    const response = NextResponse.redirect(`${origin}/editor`);
    response.cookies.set(SESSION_COOKIE, jwt, cookieOptions);
    response.cookies.delete('gh_oauth_state');
    return response;
  } catch (err) {
    console.error('GitHub OAuth callback error:', err);
    return NextResponse.redirect(`${origin}/dashboard?error=oauth_failed`);
  }
}
