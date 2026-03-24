import { Hono } from 'hono';
import type { Env } from './types';
import { pages } from './routes/pages';
import { authRoutes } from './routes/api/auth';
import { gearRoutes } from './routes/api/gear';
import { linkRoutes } from './routes/api/links';
import { categoryRoutes } from './routes/api/categories';
import { metaRoutes } from './routes/api/meta';
import { contentRoutes } from './routes/api/content';
import { collectionRoutes } from './routes/api/collections';
import { requireAuth } from './middleware/auth';
import { seedAdminIfNeeded } from './lib/seed-admin';

const app = new Hono<{ Bindings: Env }>();

// Auto-seed admin from env vars if admin_users table is empty
app.use('*', async (c, next) => {
  await seedAdminIfNeeded(c.env.DB, c.env.ADMIN_EMAIL, c.env.ADMIN_PASSWORD);
  await next();
});

// Auth routes (unprotected — login must work without auth)
app.route('/api/auth', authRoutes);

// Gear routes (public — no auth required)
app.route('/api/gear', gearRoutes);

// Links routes (GET public, POST/PUT/DELETE have inline requireAuth)
app.route('/api/links', linkRoutes);

// Categories routes (public — no auth required)
app.route('/api/categories', categoryRoutes);

// Meta routes (public — metadata fetch for link add)
app.route('/api/meta', metaRoutes);

// Content routes (GET/PUT have inline requireAuth)
app.route('/api/content', contentRoutes);

// Collections routes (GET public, POST has inline requireAuth)
app.route('/api/collections', collectionRoutes);

// Protected API routes (middleware applied to all /api/* except routes above)
app.use('/api/*', requireAuth);

// Page routes
app.route('/', pages);

export default app;
