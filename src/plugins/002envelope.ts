import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

const plugin: FastifyPluginAsync = async (app) => {
  app.setReplySerializer((payload, statusCode) => {
    if (payload === undefined) return "";

    if (isObject(payload) && ("data" in payload || "error" in payload)) {
      // Success handlers must NOT return envelopes; this prevents “random style” drift.
      // Errors are produced only by the global error handler.
      if (statusCode >= 200 && statusCode < 300) {
        throw app.httpErrors.internalServerError(
          "Handler returned an envelope. Return the raw domain object and let the framework wrap it.",
        );
      }
      return JSON.stringify(payload);
    }

    if (statusCode >= 200 && statusCode < 300) {
      return JSON.stringify({ data: payload });
    }

    return JSON.stringify(payload);
  });
};

export default fp(plugin);
