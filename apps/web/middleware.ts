import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionToken,
  isValidAdminSession,
} from './src/lib/admin-auth';

function isProtectedRegistrationsPath(pathname: string) {
  return /^\/tournaments\/[^/]+\/registrations\/?$/.test(pathname);
}

export function middleware(request: NextRequest) {
  if (!isProtectedRegistrationsPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (isValidAdminSession(session)) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/tournaments/:tournamentId/registrations'],
};
