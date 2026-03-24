import { describe, it, expect, beforeAll } from 'vitest';
import { Miniflare } from 'miniflare';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import app from '../../index';

let db: D1Database;
let sessionCookie = '';

const env = () => ({
  DB: db,
  ASSETS: {} as Fetcher,
  SITE_URL: 'http://localhost',
  ASSET_VERSION: '1',
  ADMIN_EMAIL: 'test@test.com',
  ADMIN_PASSWORD: 'testpass123',
});

beforeAll(async () => {
  const mf = new Miniflare({
    modules: true,
    script: '',
    d1Databases: ['DB'],
  });
  db = await mf.getD1Database('DB');
  const schema = readFileSync(join(__dirname, '../../../src/db/schema.sql'), 'utf-8');
  // D1 exec: strip SQL comments, collapse whitespace, split on semicolons
  const cleaned = schema.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
  const stmts = cleaned.split(';').map((s) => s.trim()).filter((s) => s.length > 0);
  for (const stmt of stmts) {
    await db.exec(stmt + ';');
  }
});

describe('Auth API', () => {
  it('POST /api/auth/login with valid credentials → 200', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'testpass123' }),
    }, env());

    expect(res.status).toBe(200);
    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toBeTruthy();
    sessionCookie = cookie!.split(';')[0];
  });

  it('POST /api/auth/login with bad password → 401', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
    }, env());

    expect(res.status).toBe(401);
  });

  it('GET /api/auth/session without cookie → unauthenticated', async () => {
    const res = await app.request('/api/auth/session', {}, env());
    const data = await res.json() as { authenticated: boolean };
    expect(data.authenticated).toBe(false);
  });

  it('GET /api/auth/session with cookie → authenticated', async () => {
    const res = await app.request('/api/auth/session', {
      headers: { Cookie: sessionCookie },
    }, env());
    const data = await res.json() as { authenticated: boolean };
    expect(data.authenticated).toBe(true);
  });

  it('POST /api/auth/logout → 200', async () => {
    const res = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    }, env());
    expect(res.status).toBe(200);
  });
});
