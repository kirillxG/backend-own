import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { errorInfoSchema, errorEnvelopeSchema } from "../schemas/envelope";

const plugin: FastifyPluginAsync = async (app) => {
  app.addSchema(errorInfoSchema);
  app.addSchema(errorEnvelopeSchema);
};

export default fp(plugin);
