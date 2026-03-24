import { Hono } from 'hono';
import type { Env } from './types';
import { pages } from './routes/pages';
import { authRoutes } from './routes/api/auth';
import { gearRoutes } from './routes/api/gear';
import { linkRoutes } from './routes/api/links';
import { categoryRoutes } from './routes/api/categories';
import { requireAuth } from './middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Auth routes (unprotected — login must work without auth)
app.route('/api/auth', authRoutes);

// Gear routes (public — no auth required)
app.route('/api/gear', gearRoutes);

// Links routes (GET public, POST/PUT/DELETE have inline requireAuth)
app.route('/api/links', linkRoutes);

// Categories routes (public — no auth required)
app.route('/api/categories', categoryRoutes);

// Protected API routes (middleware applied to all /api/* except routes above)
app.use('/api/*', requireAuth);

// Page routes
app.route('/', pages);

export default app;
