import { Hono } from 'hono';
import type { Env } from './types';
import { pages } from './routes/pages';

const app = new Hono<{ Bindings: Env }>();

app.route('/', pages);

export default app;
