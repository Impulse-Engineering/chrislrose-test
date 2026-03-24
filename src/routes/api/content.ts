import { Hono } from 'hono';
import type { Env } from '../../types';
import { requireAuth } from '../../middleware/auth';
import { updateSiteContent } from '../../db/queries';

export const contentRoutes = new Hono<{ Bindings: Env }>();

// PUT /api/content/:id — protected, updates site content
contentRoutes.put('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  if (typeof body.content !== 'string') {
    return c.json({ error: 'content string is required' }, 400);
  }

  const updated = await updateSiteContent(c.env.DB, id, body.content);
  if (!updated) {
    return c.json({ error: 'Update failed' }, 500);
  }
  return c.json(updated);
});
