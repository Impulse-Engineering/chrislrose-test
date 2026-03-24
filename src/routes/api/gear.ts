import { Hono } from 'hono';
import type { Env } from '../../types';
import { requireAuth } from '../../middleware/auth';
import {
  getGearHardware,
  getGearSoftware,
  getGearHobbies,
  getGearProjects,
  getGearPodcasts,
  getSiteContent,
  createGearItem,
  updateGearItem,
  deleteGearItem,
} from '../../db/queries';

export const gearRoutes = new Hono<{ Bindings: Env }>();

const ALLOWED_TYPES = ['hardware', 'software', 'hobbies', 'projects', 'podcasts'];

gearRoutes.get('/hardware', async (c) => {
  const items = await getGearHardware(c.env.DB);
  return c.json(items);
});

gearRoutes.get('/software', async (c) => {
  const items = await getGearSoftware(c.env.DB);
  return c.json(items);
});

gearRoutes.get('/hobbies', async (c) => {
  const items = await getGearHobbies(c.env.DB);
  return c.json(items);
});

gearRoutes.get('/projects', async (c) => {
  const items = await getGearProjects(c.env.DB);
  return c.json(items);
});

gearRoutes.get('/podcasts', async (c) => {
  const items = await getGearPodcasts(c.env.DB);
  return c.json(items);
});

gearRoutes.get('/now', async (c) => {
  const content = await getSiteContent(c.env.DB, 'now');
  if (!content) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json(content);
});

// --- Protected write endpoints ---

// POST /api/gear/:type — create gear item
gearRoutes.post('/:type', requireAuth, async (c) => {
  const type = c.req.param('type');
  if (!ALLOWED_TYPES.includes(type)) {
    return c.json({ error: 'Invalid gear type' }, 400);
  }
  const body = await c.req.json();
  if (!body.id || !body.name) {
    return c.json({ error: 'id and name are required' }, 400);
  }
  const item = await createGearItem(c.env.DB, type, body);
  if (!item) {
    return c.json({ error: 'Create failed' }, 500);
  }
  return c.json(item, 201);
});

// PUT /api/gear/:type/:id — update gear item
gearRoutes.put('/:type/:id', requireAuth, async (c) => {
  const type = c.req.param('type');
  const id = c.req.param('id');
  if (!ALLOWED_TYPES.includes(type)) {
    return c.json({ error: 'Invalid gear type' }, 400);
  }
  const body = await c.req.json();
  const item = await updateGearItem(c.env.DB, type, id, body);
  if (!item) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json(item);
});

// DELETE /api/gear/:type/:id — delete gear item
gearRoutes.delete('/:type/:id', requireAuth, async (c) => {
  const type = c.req.param('type');
  const id = c.req.param('id');
  if (!ALLOWED_TYPES.includes(type)) {
    return c.json({ error: 'Invalid gear type' }, 400);
  }
  const deleted = await deleteGearItem(c.env.DB, type, id);
  if (!deleted) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.body(null, 204);
});
