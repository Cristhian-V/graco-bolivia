import pg from 'pg';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const pool = new pg.Pool(config.db);

export async function initSchema() {
  let files = [];
  try {
    files = readdirSync(config.sqlDir).filter((f) => f.endsWith('.sql')).sort();
  } catch {
    files = [];
  }
  let applied = 0;
  for (const f of files) {
    const sql = readFileSync(path.join(config.sqlDir, f), 'utf8');
    await pool.query(sql);
    applied += 1;
  }
  return applied;
}

export { pool };
