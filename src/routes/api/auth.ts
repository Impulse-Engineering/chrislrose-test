import { Hono } from 'hono';
import type { Env } from '../../types';
import { getAdminByEmail, getAdminById } from '../../db/queries';
import { verifyPassword } from '../../lib/password';
import {
  createSession,
  destroySession,
  validateSession,
  setSessionCookie,
  clearSessionCookie,
  getSessionToken,
} from '../../lib/session';

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  const admin = await getAdminByEmail(c.env.DB, email);
  if (!admin) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await createSession(c.env.DB, admin.id);
  c.header('Set-Cookie', setSessionCookie(token));
  return c.json({ authenticated: true, email: admin.email });
});

authRoutes.post('/logout', async (c) => {
  const cookieHeader = c.req.header('cookie');
  const token = getSessionToken(cookieHeader);

  if (token) {
    await destroySession(c.env.DB, token);
  }

  c.header('Set-Cookie', clearSessionCookie());
  return c.json({ authenticated: false });
});

authRoutes.get('/session', async (c) => {
  const cookieHeader = c.req.header('cookie');
  const token = getSessionToken(cookieHeader);

  if (!token) {
    return c.json({ authenticated: false });
  }

  const session = await validateSession(c.env.DB, token);
  if (!session) {
    return c.json({ authenticated: false });
  }

  const admin = await getAdminById(c.env.DB, session.admin_id);
  return c.json({
    authenticated: true,
    email: admin?.email ?? null,
  });
});
