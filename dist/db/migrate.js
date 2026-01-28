"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
function sha256(s) {
    return node_crypto_1.default.createHash("sha256").update(s).digest("hex");
}
async function ensureMigrationsTable(c) {
    await c.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}
async function listSqlFiles(dir) {
    const entries = await promises_1.default.readdir(dir, { withFileTypes: true });
    const files = entries
        .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".sql"))
        .map((e) => e.name)
        .sort(); // filename order = migration order
    return files;
}
async function getAppliedMap(c) {
    const res = await c.query("SELECT filename, checksum FROM schema_migrations");
    return new Map(res.rows.map((r) => [r.filename, r.checksum]));
}
/**
 * Applies migrations in filename order.
 * - force=false: apply only pending files; verify checksum for already-applied.
 * - force=true: re-run ALL sql files in order (DANGEROUS unless migrations are idempotent).
 */
async function migrate(pool, opts) {
    const dir = opts?.dir ?? node_path_1.default.join(process.cwd(), "dist", "migrations");
    const force = opts?.force ?? false;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await ensureMigrationsTable(client);
        const files = await listSqlFiles(dir);
        const applied = await getAppliedMap(client);
        const result = { applied: [], skipped: [] };
        for (const filename of files) {
            const fullPath = node_path_1.default.join(dir, filename);
            const sql = await promises_1.default.readFile(fullPath, "utf8");
            const checksum = sha256(sql);
            const existing = applied.get(filename);
            if (!force) {
                if (existing) {
                    // checksum mismatch means someone edited a migration that already ran -> this is trash behavior
                    if (existing !== checksum) {
                        throw new Error(`Migration checksum mismatch for ${filename}. Do NOT edit applied migrations; create a new one.`);
                    }
                    result.skipped.push(filename);
                    continue;
                }
            }
            // Apply migration
            // Note: this runs the entire file as a single query string. Keep files reasonable.
            await client.query(sql);
            // Record (upsert so force mode updates checksum/applied_at)
            await client.query(`
        INSERT INTO schema_migrations (filename, checksum)
        VALUES ($1, $2)
        ON CONFLICT (filename)
        DO UPDATE SET checksum = EXCLUDED.checksum, applied_at = now();
        `, [filename, checksum]);
            result.applied.push(filename);
        }
        await client.query("COMMIT");
        return result;
    }
    catch (e) {
        await client.query("ROLLBACK");
        throw e;
    }
    finally {
        client.release();
    }
}
