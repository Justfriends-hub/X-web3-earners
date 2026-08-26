/**
 * Postgres access via postgres.js. In production Supabase injects
 * SUPABASE_DB_URL into every Edge Function automatically; locally you can
 * set DATABASE_URL in supabase/functions/.env for `supabase functions serve`.
 *
 * prepare: false is REQUIRED through Supabase's transaction pooler (PgBouncer).
 */

import postgres from "npm:postgres";

const connectionString =
  Deno.env.get("SUPABASE_DB_URL") ?? Deno.env.get("DATABASE_URL");

if (!connectionString) {
  throw new Error(
    "[db] No connection string found. SUPABASE_DB_URL should be auto-set in " +
      "production; set DATABASE_URL in supabase/functions/.env for local runs.",
  );
}

export const sql = postgres(connectionString, {
  prepare: false,
  max: 5,
  idle_timeout: 20,
});
