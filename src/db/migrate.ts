import type { Pool, PoolClient } from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

type MigrateResult = {
  applied: string[];
  skipped: string[];
};

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function ensureMigrationsTable(c: PoolClient) {
  await c.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function listSqlFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".sql"))
    .map((e) => e.name)
    .sort(); // filename order = migration order
  return files;
}

async function getAppliedMap(c: PoolClient): Promise<Map<string, string>> {
  const res = await c.query<{ filename: string; checksum: string }>(
    "SELECT filename, checksum FROM schema_migrations",
  );
  return new Map(res.rows.map((r) => [r.filename, r.checksum]));
}

/**
 * Applies migrations in filename order.
 * - force=false: apply only pending files; verify checksum for already-applied.
 * - force=true: re-run ALL sql files in order (DANGEROUS unless migrations are idempotent).
 */
export async function migrate(
  pool: Pool,
  opts?: { dir?: string; force?: boolean },
): Promise<MigrateResult> {
  const dir = opts?.dir ?? path.join(process.cwd(), "dist", "migrations");
  const force = opts?.force ?? false;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await ensureMigrationsTable(client);

    const files = await listSqlFiles(dir);
    const applied = await getAppliedMap(client);

    const result: MigrateResult = { applied: [], skipped: [] };

    for (const filename of files) {
      const fullPath = path.join(dir, filename);
      const sql = await fs.readFile(fullPath, "utf8");
      const checksum = sha256(sql);

      const existing = applied.get(filename);

      if (!force) {
        if (existing) {
          // checksum mismatch means someone edited a migration that already ran -> this is trash behavior
          if (existing !== checksum) {
            throw new Error(
              `Migration checksum mismatch for ${filename}. Do NOT edit applied migrations; create a new one.`,
            );
          }
          result.skipped.push(filename);
          continue;
        }
      }

      // Apply migration
      // Note: this runs the entire file as a single query string. Keep files reasonable.
      await client.query(sql);

      // Record (upsert so force mode updates checksum/applied_at)
      await client.query(
        `
        INSERT INTO schema_migrations (filename, checksum)
        VALUES ($1, $2)
        ON CONFLICT (filename)
        DO UPDATE SET checksum = EXCLUDED.checksum, applied_at = now();
        `,
        [filename, checksum],
      );

      result.applied.push(filename);
    }

    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
