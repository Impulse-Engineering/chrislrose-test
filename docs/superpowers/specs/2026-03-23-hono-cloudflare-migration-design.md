# Design: Migrate chrislrose.aseva.ai to Hono + Cloudflare

**Date:** 2026-03-23
**Status:** Draft
**Author:** Claude Code + jbryan

---

## Summary

Migrate the existing vanilla HTML/JS personal website and Supabase-backed reading list to a TypeScript + Hono stack running on Cloudflare Workers with D1 replacing Supabase as the database. Full rewrite approach — build from scratch, port features systematically, existing site stays live.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend rendering | Hono JSX (server-rendered) | Closest to current static HTML model, simple |
| Authentication | Workers-native (Web Crypto PBKDF2 + httpOnly cookie + D1 sessions) | Single admin, no external deps; PBKDF2 avoids bcrypt CPU limits on Workers |
| iOS app | Out of scope (stays on Supabase) | Separate future project |
| Deployment | Cloudflare Workers, `dev.chrislrose.aseva.ai` | Custom subdomain for dev/staging |
| Migration approach | Full rewrite | Existing 55KB+ monolithic JS files not worth incrementally converting |

## Constraints

- No PHP on target server
- iOS app must continue working on Supabase during and after migration
- Existing site (`chrislrose.aseva.ai`) stays live until new version is ready
- New development app registered separately

---

## 1. Project Structure

```
chrislrose-test/
├── src/
│   ├── index.ts              # Hono app entry, route mounting
│   ├── routes/
│   │   ├── pages.tsx          # Public page routes (/, /about, /contact, /uses)
│   │   ├── reading-list.tsx   # Reading list page route
│   │   ├── collection.tsx     # Collection share page (/c/:id)
│   │   ├── admin.tsx          # Admin dashboard page routes
│   │   └── api/
│   │       ├── links.ts       # CRUD /api/links
│   │       ├── categories.ts  # CRUD /api/categories
│   │       ├── collections.ts # CRUD /api/collections
│   │       ├── gear.ts        # CRUD /api/gear/:type
│   │       ├── content.ts     # /api/content (site_content)
│   │       └── auth.ts        # POST /api/auth/login, /logout, /session
│   ├── components/
│   │   ├── Layout.tsx         # Shared HTML shell (head, nav, footer)
│   │   ├── Nav.tsx            # Sticky frosted-glass nav
│   │   ├── LinkCard.tsx       # Reading list card
│   │   ├── GearCard.tsx       # Uses page card
│   │   └── FilterBar.tsx      # Category/search/status filters
│   ├── middleware/
│   │   ├── auth.ts            # Session validation middleware
│   │   └── cache.ts           # Cache-Control headers
│   ├── db/
│   │   ├── schema.sql         # D1 schema (CREATE TABLE statements)
│   │   ├── seed.sql           # Seed data / migration from Supabase
│   │   └── queries.ts         # Typed query helpers
│   ├── lib/
│   │   ├── password.ts        # PBKDF2 hash/verify (Web Crypto API)
│   │   ├── session.ts         # Cookie session management
│   │   └── metadata.ts        # URL metadata fetching (Microlink)
│   └── types.ts               # Shared TypeScript types
├── public/
│   ├── styles.css             # Migrated CSS
│   ├── og-image.png
│   ├── og-reading-list.png
│   └── client/
│       └── reading-list.ts    # Client-side JS for interactivity
├── wrangler.toml              # Cloudflare Workers config
├── package.json
├── tsconfig.json
└── .dev.vars                  # Local secrets (not committed)
```

### Stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono v4 with JSX renderer
- **Database:** Cloudflare D1 (SQLite)
- **Language:** TypeScript throughout
- **CSS:** Migrate existing `styles.css` as-is
- **Client JS:** Minimal — only for interactivity that can't be server-rendered (search filtering, status toggles, admin modals)
- **Testing:** vitest + miniflare

---

## 2. Database Schema (D1)

```sql
-- Links (reading list articles)
CREATE TABLE links (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  image TEXT,
  favicon TEXT,
  domain TEXT,
  category TEXT REFERENCES categories(name),
  tags TEXT,
  stars INTEGER DEFAULT 0,
  note TEXT,
  summary TEXT,
  status TEXT,
  read INTEGER DEFAULT 0,
  private INTEGER DEFAULT 0,
  saved_at TEXT NOT NULL
);

-- Categories
CREATE TABLE categories (
  name TEXT PRIMARY KEY,
  sort_order INTEGER DEFAULT 0
);

-- Collections (curated link bundles)
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  recipient TEXT,
  message TEXT,
  link_ids TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Gear tables
CREATE TABLE gear_hardware (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  badge TEXT,
  image_url TEXT,
  url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE gear_software (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  badge TEXT,
  icon TEXT,
  url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE gear_hobbies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  badge TEXT,
  image_url TEXT,
  url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE gear_projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  badge TEXT,
  icon TEXT,
  url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE gear_podcasts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  author TEXT,
  artwork_url TEXT,
  apple_url TEXT,
  url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Site content
CREATE TABLE site_content (
  id TEXT PRIMARY KEY,
  content TEXT,
  updated_at TEXT
);

-- Admin auth
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  admin_id INTEGER REFERENCES admin_users(id),
  expires_at TEXT NOT NULL
);
```

### Schema Notes

- SQLite uses `INTEGER` for booleans (0/1)
- `link_ids` in collections stored as JSON text — parsed with `json_each()` for joins
- Sessions table instead of JWT — simpler, revocable
- Dates stored as ISO8601 text strings
- Gear tables kept separate (not normalized) to match current structure

---

## 3. API Routes

### Auth

```
POST /api/auth/login     { email, password }  -> Set httpOnly cookie, redirect
POST /api/auth/logout                         -> Clear cookie, redirect
GET  /api/auth/session                        -> { authenticated: bool }
```

- PBKDF2 verify via Web Crypto API against `admin_users.password_hash`. Workers runtime caps PBKDF2 at 100,000 iterations (below OWASP's 310,000 recommendation for PBKDF2-SHA256). Acceptable for single-admin site where login is not a high-value target. bcrypt unavailable in Web Crypto; Argon2 unavailable. Password reset is manual (re-run hash utility, update wrangler secret).
- Random token stored in `sessions` table with 7-day expiry
- `session=<token>` httpOnly secure SameSite=Lax cookie: `Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
- Auth middleware: cookie -> sessions table lookup -> reject if expired
- SameSite=Lax is sufficient for this deployment — single admin on a known origin. Cross-origin POST/PATCH/DELETE requests will not include the session cookie.

### CRUD Endpoints

```
# Links
GET    /api/links              -> List (excludes private unless admin)
POST   /api/links              -> Create [auth]
PUT    /api/links/:id          -> Update [auth]
DELETE /api/links/:id          -> Delete [auth]
PATCH  /api/links/:id/status   -> Update status + read flag [auth]

# Categories
GET    /api/categories         -> List (ordered)
PUT    /api/categories         -> Replace all [auth] (uses PRAGMA defer_foreign_keys=ON in transaction to avoid FK violations during delete+reinsert)

# Collections
GET    /api/collections/:id    -> Get by ID
POST   /api/collections        -> Create [auth]

# Gear
GET    /api/gear/:type         -> List (hardware|software|hobbies|projects|podcasts)
POST   /api/gear/:type         -> Upsert [auth]
DELETE /api/gear/:type/:id     -> Delete [auth]

# Content
GET    /api/content/:id        -> Get block
PUT    /api/content/:id        -> Update [auth]

# Metadata
GET    /api/metadata?url=      -> Fetch OG data via Microlink [auth]
```

### Page Routes (server-rendered JSX)

```
GET /                -> Homepage
GET /about           -> About page
GET /contact         -> Contact page
GET /uses            -> My Gear page
GET /reading-list    -> Reading list
GET /c/:id           -> Collection (OG tags + redirect to /reading-list?collection=:id)
GET /c.html          -> Legacy redirect: parse ?id= param, redirect to /c/:id (backward compat for existing shared links). NOTE: Do not place a c.html file in public/ — the static asset handler would intercept it and the Worker redirect logic would never execute.
GET /admin           -> Admin dashboard [auth] — unified gear + reading list + content management
```

### Client-Side Interactivity

Server renders full pages. Client JS handles only:

- Search/filter (keyup handler on rendered cards)
- Status toggle (PATCH fetch + DOM update)
- Admin modals (add/edit link forms, category management)
- Collection curation (selection mode, share link generation)
- Bookmarklet (quick-save via API)

---

## 4. Data Migration

### Process

1. **Export:** Script using Supabase JS client to dump all tables as JSON
2. **Transform:** Convert JSON to SQL INSERT statements (boolean -> integer, dates -> ISO strings)
3. **Import:** `wrangler d1 execute` with generated SQL. **Order matters:** `categories` must be inserted before `links` due to FK constraint. Do not rely on `PRAGMA defer_foreign_keys` in `wrangler d1 execute` batch mode — its behavior across statement boundaries is inconsistent. Use insert ordering instead.
4. **Verify:** Row counts + spot-check queries

### What Migrates

- `links`, `categories`, `collections` — full data
- `gear_hardware`, `gear_software`, `gear_hobbies`, `gear_projects`, `gear_podcasts` — full data
- `site_content` — full data

### What Doesn't Migrate

- Supabase auth users — create fresh admin in `admin_users` with PBKDF2 hash
- Supabase stays running for iOS app

---

## 5. Deployment

```toml
# wrangler.toml
name = "chrislrose-dev"
compatibility_date = "2026-03-01"

[[d1_databases]]
binding = "DB"
database_name = "chrislrose-dev"
database_id = "<created-by-wrangler>"

[assets]
directory = "./public"
binding = "ASSETS"

[vars]
SITE_URL = "https://dev.chrislrose.aseva.ai"
ASSET_VERSION = "20260323000000"  # Update on each deploy (CI or manual)
```

Secrets via `wrangler secret put`:
- `ADMIN_EMAIL` — initial admin email
- `ADMIN_PASSWORD_HASH` — PBKDF2 hash of admin password

Note: Session tokens are opaque random strings validated by DB lookup. No signing secret needed — the token in the cookie is looked up directly in the `sessions` table.

### Static Assets

- CSS, images served via Workers native `[assets]` binding from `public/` directory
- Image proxy: reuse `wsrv.nl` for Instagram/Threads CDN images (URL rewrite in LinkCard component)

### Cache Busting

Use `ASSET_VERSION` env var (set in `wrangler.toml [vars]`, updated on each deploy):
```tsx
// In Layout.tsx
<link rel="stylesheet" href={`/styles.css?v=${c.env.ASSET_VERSION}`} />
```
This produces a stable version per deploy — unlike `Date.now()` which changes on every Worker cold start.

---

## 6. Error Handling

- **API routes:** JSON `{ error: string }` with HTTP status codes (400, 401, 404, 500)
- **Page routes:** Styled error page via `app.onError()`
- **Auth failures:** Redirect to login (pages) or 401 (API)
- **D1 errors:** Catch, log to Workers console, return 500
- **Metadata fetch failures:** Return partial data (non-blocking)

---

## 7. Testing

- **vitest + miniflare** for unit/integration tests against local D1
- Focus: API routes (CRUD correctness), auth middleware (session validation), query helpers
- Manual verification of rendered pages via `wrangler dev`

---

## 8. Out of Scope

- iOS app changes (separate future project)
- Supabase teardown (keep for iOS)
- New features not in current site
- CSS redesign (migrate as-is)
- SEO changes beyond preserving OG tags
- Analytics or monitoring
- Rate limiting

---

*Spec created: 2026-03-23*
