import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import type { FastifyPluginAsync } from "fastify";

const plugin: FastifyPluginAsync = async (app) => {
  await app.register(swagger, {
    openapi: {
      info: { title: "API", version: "1.0.0" },
    },
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs",
  });
};

export default fp(plugin);
