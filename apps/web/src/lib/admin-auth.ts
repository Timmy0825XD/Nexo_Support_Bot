export const ADMIN_SESSION_COOKIE = 'admin_session';

export function getAdminUsername() {
  return process.env.ADMIN_USERNAME ?? 'Admin';
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? 'Admin@123';
}

export function getAdminSessionToken() {
  return process.env.ADMIN_SESSION_TOKEN ?? 'mw-admin-dev-session';
}

export function isValidAdminSession(cookieValue: string | undefined) {
  return cookieValue === getAdminSessionToken();
}
