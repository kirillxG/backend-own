import Fastify from "fastify";
import autoload from "@fastify/autoload";
import path from "node:path";

export function buildApp() {
  const app = Fastify({ logger: true });

  // Plugins first
  app.register(autoload, {
    dir: path.join(__dirname, "plugins"),
  });

  // Routes after plugins (schemas, envelope, error handler must be ready)
  app.register(autoload, {
    dir: path.join(__dirname, "routes"),
    options: { prefix: "/v1" },
  });

  return app;
}
