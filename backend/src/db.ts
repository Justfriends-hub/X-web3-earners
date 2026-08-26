import pg from "pg";

/**
 * Postgres access layer (Supabase). Replaces the old local SQLite file so
 * data survives deploys/restarts on hosts like Render. Plain SQL through a
 * small pool wrapper — no ORM.
 *
 * Required env var:
 *   DATABASE_URL — Supabase "Transaction pooler" connection string
 *                  (Project Settings → Database → Connection pooling).
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "[db] DATABASE_URL is not set. Paste your Supabase connection string " +
      "(Settings → Database → Connection pooling) into backend/.env"
  );
}

export const pool = new pg.Pool({
  connectionString,
  max: 5,
  // Supabase serves TLS; the pooler chain doesn't need CA pinning for this MVP.
  ssl: { rejectUnauthorized: false },
});

export interface Queryable {
  query<T = any>(text: string, params?: unknown[]): Promise<T[]>;
  queryOne<T = any>(text: string, params?: unknown[]): Promise<T | undefined>;
}

export async function query<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(text, params as any[]);
  return result.rows as T[];
}

export async function queryOne<T = any>(
  text: string,
  params: unknown[] = []
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

/** Runs fn inside a transaction: commit on success, rollback on throw. */
export async function withTransaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tx: Queryable = {
      async query<U = any>(text: string, params: unknown[] = []): Promise<U[]> {
        const result = await client.query(text, params as any[]);
        return result.rows as U[];
      },
      async queryOne<U = any>(text: string, params: unknown[] = []): Promise<U | undefined> {
        const rows = await this.query<U>(text, params);
        return rows[0];
      },
    };
    const out = await fn(tx);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
