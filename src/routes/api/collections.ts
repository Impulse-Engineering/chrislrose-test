import { Hono } from 'hono';
import type { Env } from '../../types';
import { requireAuth } from '../../middleware/auth';
import { createCollection, getCollectionById } from '../../db/queries';

export const collectionRoutes = new Hono<{ Bindings: Env }>();

function generateCollectionId(): string {
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// POST /api/collections — protected, creates a collection
collectionRoutes.post('/', requireAuth, async (c) => {
  const body = await c.req.json();

  if (!body.link_ids || !Array.isArray(body.link_ids) || body.link_ids.length === 0) {
    return c.json({ error: 'link_ids array is required and must not be empty' }, 400);
  }

  const id = generateCollectionId();
  const collection = await createCollection(c.env.DB, {
    id,
    recipient: body.recipient || null,
    message: body.message || null,
    link_ids: JSON.stringify(body.link_ids),
    created_at: new Date().toISOString(),
  });

  if (!collection) {
    return c.json({ error: 'Create failed' }, 500);
  }

  // Parse link_ids back to array for response
  return c.json({
    ...collection,
    link_ids: JSON.parse(collection.link_ids),
  }, 201);
});

// GET /api/collections/:id — public, returns collection by ID
collectionRoutes.get('/:id', async (c) => {
  const collection = await getCollectionById(c.env.DB, c.req.param('id'));

  if (!collection) {
    return c.json({ error: 'Not found' }, 404);
  }

  // Parse link_ids from JSON string to array
  return c.json({
    ...collection,
    link_ids: JSON.parse(collection.link_ids),
  });
});
