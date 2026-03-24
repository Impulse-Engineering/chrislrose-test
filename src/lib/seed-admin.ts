import { hashPassword } from './password';

let seeded = false;

/**
 * Auto-seed admin user from ADMIN_EMAIL / ADMIN_PASSWORD env vars
 * if the admin_users table is empty. Runs once per Worker lifecycle.
 * Hashes the plaintext password with PBKDF2 before storing.
 */
export async function seedAdminIfNeeded(
  db: D1Database,
  email?: string,
  password?: string
): Promise<void> {
  if (seeded || !email || !password) return;
  seeded = true;

  const row = await db.prepare('SELECT COUNT(*) as cnt FROM admin_users').first<{ cnt: number }>();
  if (row && row.cnt > 0) return;

  const hash = await hashPassword(password);
  await db.prepare('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)').bind(email, hash).run();
}
