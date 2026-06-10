import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from './admin-auth';

export async function requireAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!isValidAdminSession(session)) {
    return false;
  }

  return true;
}
