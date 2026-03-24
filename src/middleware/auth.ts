import { createMiddleware } from 'hono/factory';
import type { Env } from '../types';
import { validateSession, getSessionToken } from '../lib/session';

export const requireAuth = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const cookieHeader = c.req.header('cookie');
    const token = getSessionToken(cookieHeader);

    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = await validateSession(c.env.DB, token);
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set('session' as never, session);
    await next();
  }
);
