let initialized = false;

/**
 * Ensure all D1 tables exist. Runs once per Worker lifecycle.
 * Uses CREATE TABLE IF NOT EXISTS so it's safe to run on every cold start.
 */
export async function ensureSchema(db: D1Database): Promise<void> {
  if (initialized) return;
  initialized = true;

  const statements = [
    `CREATE TABLE IF NOT EXISTS categories (name TEXT PRIMARY KEY, sort_order INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS links (id TEXT PRIMARY KEY, url TEXT NOT NULL, title TEXT, description TEXT, image TEXT, favicon TEXT, domain TEXT, category TEXT REFERENCES categories(name), tags TEXT, stars INTEGER DEFAULT 0, note TEXT, summary TEXT, status TEXT, read INTEGER DEFAULT 0, private INTEGER DEFAULT 0, saved_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_links_category ON links(category)`,
    `CREATE INDEX IF NOT EXISTS idx_links_saved_at ON links(saved_at DESC)`,
    `CREATE TABLE IF NOT EXISTS collections (id TEXT PRIMARY KEY, recipient TEXT, message TEXT, link_ids TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS gear_hardware (id TEXT PRIMARY KEY, name TEXT NOT NULL, badge TEXT, image_url TEXT, url TEXT, description TEXT, sort_order INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS gear_software (id TEXT PRIMARY KEY, name TEXT NOT NULL, badge TEXT, icon TEXT, url TEXT, description TEXT, sort_order INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS gear_hobbies (id TEXT PRIMARY KEY, name TEXT NOT NULL, badge TEXT, image_url TEXT, url TEXT, description TEXT, sort_order INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS gear_projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, badge TEXT, icon TEXT, url TEXT, description TEXT, sort_order INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS gear_podcasts (id TEXT PRIMARY KEY, name TEXT NOT NULL, author TEXT, artwork_url TEXT, apple_url TEXT, url TEXT, description TEXT, sort_order INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS site_content (id TEXT PRIMARY KEY, content TEXT, updated_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, admin_id INTEGER REFERENCES admin_users(id), expires_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`,
  ];

  await db.batch(statements.map((sql) => db.prepare(sql)));
}
