import type { AdminUser, Session, Link, Category, GearItem, SiteContent } from '../types';

// --- Admin queries ---

export async function getAdminByEmail(
  db: D1Database,
  email: string
): Promise<AdminUser | null> {
  const result = await db
    .prepare('SELECT id, email, password_hash FROM admin_users WHERE email = ?')
    .bind(email)
    .first<AdminUser>();
  return result ?? null;
}

export async function getAdminById(
  db: D1Database,
  id: number
): Promise<AdminUser | null> {
  const result = await db
    .prepare('SELECT id, email, password_hash FROM admin_users WHERE id = ?')
    .bind(id)
    .first<AdminUser>();
  return result ?? null;
}

// --- Session queries ---

export async function createSession(
  db: D1Database,
  token: string,
  adminId: number,
  expiresAt: string
): Promise<void> {
  await db
    .prepare('INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, adminId, expiresAt)
    .run();
}

export async function getSession(
  db: D1Database,
  token: string
): Promise<Session | null> {
  const result = await db
    .prepare('SELECT token, admin_id, expires_at FROM sessions WHERE token = ? AND expires_at > datetime(\'now\')')
    .bind(token)
    .first<Session>();
  return result ?? null;
}

export async function deleteSession(
  db: D1Database,
  token: string
): Promise<void> {
  await db
    .prepare('DELETE FROM sessions WHERE token = ?')
    .bind(token)
    .run();
}

export async function deleteExpiredSessions(
  db: D1Database
): Promise<void> {
  await db
    .prepare('DELETE FROM sessions WHERE expires_at <= datetime(\'now\')')
    .run();
}

// --- Link queries ---

export interface GetLinksOptions {
  category?: string;
  status?: string;
  includePrivate?: boolean;
}

export async function getLinks(
  db: D1Database,
  opts: GetLinksOptions = {}
): Promise<Link[]> {
  const conditions: string[] = [];
  const bindings: unknown[] = [];

  if (!opts.includePrivate) {
    conditions.push('private = 0');
  }
  if (opts.category) {
    conditions.push('category = ?');
    bindings.push(opts.category);
  }
  if (opts.status) {
    conditions.push('status = ?');
    bindings.push(opts.status);
  }

  const where = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
  const sql = 'SELECT * FROM links' + where + ' ORDER BY saved_at DESC';

  const stmt = db.prepare(sql);
  const result = bindings.length > 0
    ? await stmt.bind(...bindings).all<Link>()
    : await stmt.all<Link>();

  return result.results;
}

export async function getLinkById(
  db: D1Database,
  id: string
): Promise<Link | null> {
  const result = await db
    .prepare('SELECT * FROM links WHERE id = ?')
    .bind(id)
    .first<Link>();
  return result ?? null;
}

export async function createLink(
  db: D1Database,
  data: Omit<Link, 'id' | 'saved_at' | 'read'>
): Promise<Link> {
  const id = Date.now().toString(36);
  const savedAt = new Date().toISOString();
  const read = data.status === 'done' ? 1 : 0;

  await db
    .prepare(
      `INSERT INTO links (id, url, title, description, image, favicon, domain, category, tags, stars, note, summary, status, read, private, saved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.url,
      data.title ?? null,
      data.description ?? null,
      data.image ?? null,
      data.favicon ?? null,
      data.domain ?? null,
      data.category ?? null,
      data.tags ?? null,
      data.stars ?? 0,
      data.note ?? null,
      data.summary ?? null,
      data.status ?? null,
      read,
      data.private ?? 0,
      savedAt
    )
    .run();

  return { id, ...data, read, saved_at: savedAt } as Link;
}

export async function updateLink(
  db: D1Database,
  id: string,
  data: Partial<Omit<Link, 'id' | 'saved_at'>>
): Promise<Link | null> {
  const existing = await getLinkById(db, id);
  if (!existing) return null;

  const merged = { ...existing, ...data };
  // Keep read in sync with status
  merged.read = merged.status === 'done' ? 1 : 0;

  await db
    .prepare(
      `UPDATE links SET url = ?, title = ?, description = ?, image = ?, favicon = ?, domain = ?, category = ?, tags = ?, stars = ?, note = ?, summary = ?, status = ?, read = ?, private = ?
       WHERE id = ?`
    )
    .bind(
      merged.url,
      merged.title,
      merged.description,
      merged.image,
      merged.favicon,
      merged.domain,
      merged.category,
      merged.tags,
      merged.stars,
      merged.note,
      merged.summary,
      merged.status,
      merged.read,
      merged.private,
      id
    )
    .run();

  return merged;
}

export async function deleteLink(
  db: D1Database,
  id: string
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM links WHERE id = ?')
    .bind(id)
    .run();
  return result.meta.changes > 0;
}

// --- Category queries ---

export async function getCategories(
  db: D1Database
): Promise<Category[]> {
  const result = await db
    .prepare('SELECT name, sort_order FROM categories ORDER BY sort_order ASC')
    .all<Category>();
  return result.results;
}

// --- Gear queries ---

export async function getGearHardware(db: D1Database): Promise<GearItem[]> {
  const result = await db
    .prepare('SELECT * FROM gear_hardware ORDER BY sort_order')
    .all<GearItem>();
  return result.results;
}

export async function getGearSoftware(db: D1Database): Promise<GearItem[]> {
  const result = await db
    .prepare('SELECT * FROM gear_software ORDER BY sort_order')
    .all<GearItem>();
  return result.results;
}

export async function getGearHobbies(db: D1Database): Promise<GearItem[]> {
  const result = await db
    .prepare('SELECT * FROM gear_hobbies ORDER BY sort_order')
    .all<GearItem>();
  return result.results;
}

export async function getGearProjects(db: D1Database): Promise<GearItem[]> {
  const result = await db
    .prepare('SELECT * FROM gear_projects ORDER BY sort_order')
    .all<GearItem>();
  return result.results;
}

export async function getGearPodcasts(db: D1Database): Promise<GearItem[]> {
  const result = await db
    .prepare('SELECT * FROM gear_podcasts ORDER BY sort_order')
    .all<GearItem>();
  return result.results;
}

export async function getSiteContent(
  db: D1Database,
  id: string
): Promise<SiteContent | null> {
  const result = await db
    .prepare('SELECT * FROM site_content WHERE id = ?')
    .bind(id)
    .first<SiteContent>();
  return result ?? null;
}
