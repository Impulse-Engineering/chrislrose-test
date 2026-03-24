import { Hono } from 'hono';
import type { Env } from '../../types';
import { requireAuth } from '../../middleware/auth';
import {
  getLinks,
  getLinkById,
  createLink,
  updateLink,
  deleteLink,
} from '../../db/queries';

export const linkRoutes = new Hono<{ Bindings: Env }>();

// GET /api/links — public, returns non-private links with optional filters
linkRoutes.get('/', async (c) => {
  const category = c.req.query('category');
  const status = c.req.query('status');

  const links = await getLinks(c.env.DB, {
    category: category || undefined,
    status: status || undefined,
    includePrivate: false,
  });

  return c.json(links);
});

// GET /api/links/:id — public, returns single link (non-private)
linkRoutes.get('/:id', async (c) => {
  const link = await getLinkById(c.env.DB, c.req.param('id'));

  if (!link || link.private) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json(link);
});

// POST /api/links — protected, creates a new link
linkRoutes.post('/', requireAuth, async (c) => {
  const body = await c.req.json();

  if (!body.url) {
    return c.json({ error: 'url is required' }, 400);
  }

  const link = await createLink(c.env.DB, {
    url: body.url,
    title: body.title ?? null,
    description: body.description ?? null,
    image: body.image ?? null,
    favicon: body.favicon ?? null,
    domain: body.domain ?? null,
    category: body.category ?? null,
    tags: body.tags ?? null,
    stars: body.stars ?? 0,
    note: body.note ?? null,
    summary: body.summary ?? null,
    status: body.status ?? null,
    private: body.private ?? 0,
  });

  return c.json(link, 201);
});

// PUT /api/links/:id — protected, updates an existing link
linkRoutes.put('/:id', requireAuth, async (c) => {
  const body = await c.req.json();
  const updated = await updateLink(c.env.DB, c.req.param('id'), body);

  if (!updated) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json(updated);
});

// DELETE /api/links/:id — protected, deletes a link
linkRoutes.delete('/:id', requireAuth, async (c) => {
  const deleted = await deleteLink(c.env.DB, c.req.param('id'));

  if (!deleted) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.body(null, 204);
});
