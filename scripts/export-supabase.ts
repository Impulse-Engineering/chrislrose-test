/**
 * export-supabase.ts — Export all data tables from Supabase to JSON files
 *
 * Usage: npx tsx scripts/export-supabase.ts
 *
 * Requires environment variables:
 *   SUPABASE_URL      — e.g. https://xxx.supabase.co
 *   SUPABASE_ANON_KEY — the anon/public key
 *
 * Exports to scripts/data/{table}.json
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.');
  console.error('Set them in your shell or in a .env file.');
  process.exit(1);
}

// Tables to export (skip admin_users and sessions — created fresh in new app)
const TABLES = [
  'categories',
  'links',
  'collections',
  'gear_hardware',
  'gear_software',
  'gear_hobbies',
  'gear_projects',
  'gear_podcasts',
  'site_content',
];

async function exportTable(table: string): Promise<number> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY!,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to export ${table}: ${res.status} ${text}`);
  }

  const data = await res.json() as unknown[];
  const outPath = join(DATA_DIR, `${table}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  return data.length;
}

async function main(): Promise<void> {
  mkdirSync(DATA_DIR, { recursive: true });

  console.log('Exporting from Supabase...');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log('');

  let totalRows = 0;

  for (const table of TABLES) {
    try {
      const count = await exportTable(table);
      totalRows += count;
      console.log(`  ${table}: ${count} rows`);
    } catch (err) {
      console.error(`  ${table}: ERROR — ${(err as Error).message}`);
    }
  }

  console.log('');
  console.log(`Total: ${totalRows} rows exported to scripts/data/`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
