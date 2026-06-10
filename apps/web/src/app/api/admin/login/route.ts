import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  getAdminPassword,
  getAdminSessionToken,
  getAdminUsername,
} from '../../../../lib/admin-auth';

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };

  if (body.username !== getAdminUsername() || body.password !== getAdminPassword()) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, getAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
