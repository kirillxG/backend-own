import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyPluginAsync } from "fastify";

const plugin: FastifyPluginAsync = async (app) => {
  await app.register(jwt, {
    secret: app.config.JWT_SECRET,
    cookie: {
      cookieName: app.config.COOKIE_NAME,
      signed: true,
    },
    sign: {
      expiresIn: app.config.JWT_EXPIRES_IN ?? "15m",
    },
  });

  app.decorate("auth", async (req: any) => {
    // verifies token from cookie automatically
    const payload = await req.jwtVerify();
    req.authUser = { id: String(payload.sub) };
  });
};

export default fp(plugin);
