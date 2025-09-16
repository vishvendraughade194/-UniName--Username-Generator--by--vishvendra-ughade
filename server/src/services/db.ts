import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL || '';
let pool: Pool | null = null;

export function getDb(): Pool | null {
  if (!databaseUrl) return null;
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function initDb(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      birth_date TEXT,
      word TEXT,
      username TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}


