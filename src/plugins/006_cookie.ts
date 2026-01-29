import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import type { FastifyPluginAsync } from "fastify";

const plugin: FastifyPluginAsync = async (app) => {
  await app.register(cookie, {
    secret: app.config.COOKIE_SECRET, // for signed cookies (optional but recommended)
    hook: "onRequest",
  });
};

export default fp(plugin);
