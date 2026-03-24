import { Hono } from 'hono';
import type { Env } from '../../types';
import { requireAuth } from '../../middleware/auth';
import { getCategories, replaceCategories } from '../../db/queries';

export const categoryRoutes = new Hono<{ Bindings: Env }>();

// GET /api/categories — public, returns sorted category list
categoryRoutes.get('/', async (c) => {
  const categories = await getCategories(c.env.DB);
  return c.json(categories);
});

// POST /api/categories — protected, replaces all categories with sorted list
categoryRoutes.post('/', requireAuth, async (c) => {
  const body = await c.req.json();
  const list = body.categories;

  if (!Array.isArray(list)) {
    return c.json({ error: 'categories array is required' }, 400);
  }

  const categories = list.map((item: { name: string }, i: number) => ({
    name: String(item.name || item),
    sort_order: i,
  }));

  await replaceCategories(c.env.DB, categories);
  const updated = await getCategories(c.env.DB);
  return c.json(updated);
});
