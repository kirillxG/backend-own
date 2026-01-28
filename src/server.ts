import { buildApp } from "./app";
import type { Env } from "./types/env";

const app = buildApp();

async function start() {
  await app.ready();

  const env = app.config as Env; // provided by @fastify/env
  await app.listen({ port: env.PORT, host: env.HOST });
}

start().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
