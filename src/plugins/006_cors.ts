import fp from "fastify-plugin";
import cors from "@fastify/cors";
import type { FastifyPluginAsync } from "fastify";

const plugin: FastifyPluginAsync = async (app) => {
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow non-browser tools (Postman, curl)
      if (!origin) return cb(null, true);

      if (origin === app.config.FRONTEND_ORIGIN) {
        return cb(null, true);
      }

      cb(new Error("Not allowed by CORS"), false);
    },

    credentials: true, // REQUIRED for cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    exposedHeaders: [],

    maxAge: 86400, // cache preflight 24h
  });
};

export default fp(plugin);
