import * as queries from '../db/queries';
import type { Session } from '../types';

const SESSION_MAX_AGE = 604800; // 7 days in seconds

export async function createSession(
  db: D1Database,
  adminId: number
): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
  await queries.createSession(db, token, adminId, expiresAt);
  return token;
}

export async function validateSession(
  db: D1Database,
  token: string
): Promise<Session | null> {
  if (!token) return null;
  return queries.getSession(db, token);
}

export async function destroySession(
  db: D1Database,
  token: string
): Promise<void> {
  await queries.deleteSession(db, token);
}

export function setSessionCookie(token: string): string {
  return `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`;
}

export function clearSessionCookie(): string {
  return 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

export function getSessionToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  return match ? match[1] : null;
}
