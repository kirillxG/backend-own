import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { Pool } from "pg";

import "dotenv/config";

const plugin: FastifyPluginAsync = async (app) => {
  const pool = new Pool({
    connectionString: app.config.DATABASE_URL,
  });

  // quick sanity check early
  await pool.query("select 1 as ok");

  app.decorate("pg", pool);

  app.addHook("onClose", async () => {
    await pool.end();
  });
};

export default fp(plugin);
