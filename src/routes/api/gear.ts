import { Hono } from 'hono';
import type { Env } from '../../types';
import {
  getGearHardware,
  getGearSoftware,
  getGearHobbies,
  getGearProjects,
  getGearPodcasts,
  getSiteContent,
} from '../../db/queries';

export const gearRoutes = new Hono<{ Bindings: Env }>();

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
