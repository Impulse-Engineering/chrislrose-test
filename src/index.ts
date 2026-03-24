import { Hono } from 'hono';
import type { Env } from './types';
import { pages } from './routes/pages';
import { authRoutes } from './routes/api/auth';
import { requireAuth } from './middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Auth routes (unprotected — login must work without auth)
app.route('/api/auth', authRoutes);

// Protected API routes (middleware applied to all /api/* except /api/auth)
app.use('/api/*', requireAuth);

// Page routes
app.route('/', pages);

export default app;
