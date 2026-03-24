import type { AdminUser, Session } from '../types';

// --- Admin queries ---

export async function getAdminByEmail(
  db: D1Database,
  email: string
): Promise<AdminUser | null> {
  const result = await db
    .prepare('SELECT id, email, password_hash FROM admin_users WHERE email = ?')
    .bind(email)
    .first<AdminUser>();
  return result ?? null;
}

export async function getAdminById(
  db: D1Database,
  id: number
): Promise<AdminUser | null> {
  const result = await db
    .prepare('SELECT id, email, password_hash FROM admin_users WHERE id = ?')
    .bind(id)
    .first<AdminUser>();
  return result ?? null;
}

// --- Session queries ---

export async function createSession(
  db: D1Database,
  token: string,
  adminId: number,
  expiresAt: string
): Promise<void> {
  await db
    .prepare('INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, adminId, expiresAt)
    .run();
}

export async function getSession(
  db: D1Database,
  token: string
): Promise<Session | null> {
  const result = await db
    .prepare('SELECT token, admin_id, expires_at FROM sessions WHERE token = ? AND expires_at > datetime(\'now\')')
    .bind(token)
    .first<Session>();
  return result ?? null;
}

export async function deleteSession(
  db: D1Database,
  token: string
): Promise<void> {
  await db
    .prepare('DELETE FROM sessions WHERE token = ?')
    .bind(token)
    .run();
}

export async function deleteExpiredSessions(
  db: D1Database
): Promise<void> {
  await db
    .prepare('DELETE FROM sessions WHERE expires_at <= datetime(\'now\')')
    .run();
}
