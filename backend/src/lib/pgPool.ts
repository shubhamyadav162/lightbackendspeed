import { Pool } from 'pg';

// Connection string for Supabase connection pool (pgbouncer)
const connStr = process.env.SUPABASE_DB_POOL;

let _pool: Pool | null = null;

/**
 * Returns a singleton `pg.Pool` instance if `SUPABASE_DB_POOL` is defined.
 * The pool lazily initialises on first access so that unit tests that do not
 * depend on Postgres can run without a database.
 */
export function getPgPool(): Pool | null {
  if (!connStr) return null;
  if (!_pool) {
    _pool = new Pool({ connectionString: connStr, max: 8 });
    // Best-effort listener to gracefully dispose when the Node process exits
    process.once('beforeExit', async () => {
      try {
        await _pool?.end();
      } catch (_) {
        // ignore
      }
    });
  }
  return _pool;
} 