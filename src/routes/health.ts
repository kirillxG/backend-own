import type { FastifyPluginAsync } from "fastify";
import { healthDataSchema } from "../schemas/health";
import { successEnvelope } from "../schemas/envelope";

const route: FastifyPluginAsync = async (app) => {
  app.addSchema(healthDataSchema);

  app.get(
    "/health",
    {
      schema: {
        response: {
          200: successEnvelope("healthData#"),
          400: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async () => {
      return { status: "ok" }; // MUST be raw domain object
    },
  );
};

export default route;
