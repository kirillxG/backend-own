#!/usr/bin/env node
import { Pool } from "pg";
import path from "node:path";
import { migrate } from "../db/migrate";

import "dotenv/config";

type Args = {
  force: boolean;
  dir?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") args.force = true;
    else if (a === "--dir") ((args.dir = argv[i + 1]), i++);
    else if (a === "-h" || a === "--help") {
      console.log(
        [
          "Usage: migrate [--force] [--dir <path>]",
          "",
          "Env:",
          "  DATABASE_URL  Postgres connection string",
          "  NODE_ENV      development|test|production (force blocked in production)",
          "",
          "Options:",
          "  --force       Re-run all migrations (dangerous; requires idempotent SQL).",
          "  --dir         Migrations directory (default: dist/migrations).",
        ].join("\n"),
      );
      process.exit(0);
    } else {
      console.error(`Unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

async function main() {
  const { force, dir } = parseArgs(process.argv.slice(2));

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("Missing env: DATABASE_URL");
    process.exit(2);
  }

  const NODE_ENV = process.env.NODE_ENV ?? "development";
  if (force && NODE_ENV === "production") {
    console.error("Refusing to run with --force in production.");
    process.exit(2);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // default to dist/migrations at runtime
    const migrationsDir = dir ?? path.join(process.cwd(), "dist", "migrations");
    const res = await migrate(pool, { dir: migrationsDir, force });

    console.log("Migrations complete.");
    console.log(`Applied: ${res.applied.length}`);
    if (res.applied.length)
      console.log(res.applied.map((x) => `  + ${x}`).join("\n"));
    console.log(`Skipped: ${res.skipped.length}`);
    if (res.skipped.length)
      console.log(res.skipped.map((x) => `  = ${x}`).join("\n"));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err?.stack ?? String(err));
  process.exit(1);
});
