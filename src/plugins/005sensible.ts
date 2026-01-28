import fp from "fastify-plugin";
import sensible from "@fastify/sensible";
import type { FastifyPluginAsync } from "fastify";

const plugin: FastifyPluginAsync = async (app) => {
  await app.register(sensible);
};

export default fp(plugin);
