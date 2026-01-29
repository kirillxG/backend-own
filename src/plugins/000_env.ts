import fp from "fastify-plugin";
import envPlugin from "@fastify/env";
import type { FastifyPluginAsync } from "fastify";

const schema = {
  type: "object",
  required: ["PORT", "HOST"],
  properties: {
    NODE_ENV: { type: "string", default: "development" },
    PORT: { type: "integer", default: 3000 },
    HOST: { type: "string", default: "0.0.0.0" },
    DATABASE_URL: { type: "string" },
    JWT_SECRET: { type: "string" },
    JWT_EXPIRES_IN: { type: "string" },
    COOKIE_SECRET: { type: "string" },
    COOKIE_NAME: { type: "string" },
    FRONTEND_ORIGIN: { type: "string" },
  },
} as const;

const env: FastifyPluginAsync = async (app) => {
  await app.register(envPlugin, {
    schema,
    dotenv: true, // reads .env if present
  });
};

export default fp(env);
