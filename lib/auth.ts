import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { GitHubSession } from './types';

export const SESSION_COOKIE = 'gh_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET env var is not set');
  return new TextEncoder().encode(s);
}

export async function createSessionToken(session: GitHubSession): Promise<string> {
  return new SignJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(secret());
}

export async function getSession(): Promise<GitHubSession | null> {
  try {
    const raw = cookies().get(SESSION_COOKIE)?.value;
    if (!raw) return null;
    const { payload } = await jwtVerify(raw, secret());
    return payload as unknown as GitHubSession;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<GitHubSession | null> {
  try {
    const raw = req.cookies.get(SESSION_COOKIE)?.value;
    if (!raw) return null;
    const { payload } = await jwtVerify(raw, secret());
    return payload as unknown as GitHubSession;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: COOKIE_MAX_AGE,
  path: '/',
};
