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
  const cleaned = schema.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
  const stmts = cleaned.split(';').map((s) => s.trim()).filter((s) => s.length > 0);
  for (const stmt of stmts) {
    await db.exec(stmt + ';');
  }

  // Login to get session cookie
  const loginRes = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'testpass123' }),
  }, env());
  const cookie = loginRes.headers.get('Set-Cookie');
  if (cookie) sessionCookie = cookie.split(';')[0];
});

describe('Links API', () => {
  it('GET /api/links → 200, returns array', async () => {
    const res = await app.request('/api/links', {}, env());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('POST /api/links without auth → 401', async () => {
    const res = await app.request('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com', title: 'Test', saved_at: new Date().toISOString() }),
    }, env());
    expect(res.status).toBe(401);
  });

  it('POST /api/links with auth → 201', async () => {
    const res = await app.request('/api/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        url: 'https://example.com',
        title: 'Test Link',
        saved_at: new Date().toISOString(),
      }),
    }, env());
    expect(res.status).toBe(201);
  });
});

describe('Categories API', () => {
  it('GET /api/categories → 200, returns array', async () => {
    const res = await app.request('/api/categories', {}, env());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe('Collections API', () => {
  it('POST /api/collections without auth → 401', async () => {
    const res = await app.request('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_ids: ['abc'] }),
    }, env());
    expect(res.status).toBe(401);
  });
});

describe('Legacy redirect', () => {
  it('GET /c.html?id=test123 → 301 redirect to /c/test123', async () => {
    const res = await app.request('/c.html?id=test123', {
      redirect: 'manual',
    }, env());
    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('/c/test123');
  });
});
