import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyPluginAsync } from "fastify";

const plugin: FastifyPluginAsync = async (app) => {
  await app.register(jwt, {
    secret: app.config.JWT_SECRET,
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
    },
  });

  app.decorate("auth", async (req: any) => {
    await req.jwtVerify();
  });
};

export default fp(plugin);
