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
    const payload = await req.jwtVerify();
    // payload.sub should be user id
    req.authUser = { id: String(payload.sub) };
  });
};

export default fp(plugin);
