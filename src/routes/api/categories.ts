import { Hono } from 'hono';
import type { Env } from '../../types';
import { getCategories } from '../../db/queries';

export const categoryRoutes = new Hono<{ Bindings: Env }>();

// GET /api/categories — public, returns sorted category list
categoryRoutes.get('/', async (c) => {
  const categories = await getCategories(c.env.DB);
  return c.json(categories);
});
