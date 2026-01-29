import fp from "fastify-plugin";
import type { FastifyError, FastifyPluginAsync } from "fastify";

type ErrorInfo = {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
};

function toErrorEnvelope(
  err: FastifyError,
  requestId?: string,
  isProd?: boolean,
) {
  // Validation errors: safe to expose shape, but not stack
  if ((err as any).validation) {
    return {
      statusCode: 400,
      body: {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: (err as any).validation,
          requestId,
        } satisfies ErrorInfo,
      },
    };
  }

  const statusCode =
    typeof err.statusCode === "number" && err.statusCode >= 400
      ? err.statusCode
      : 500;

  // Never leak internal messages for 500 in prod
  const message =
    statusCode === 500 && isProd
      ? "Internal Server Error"
      : err.message || "Error";

  const code =
    err.code ?? (statusCode === 500 ? "INTERNAL_ERROR" : `HTTP_${statusCode}`);

  // Optional details only when not prod AND not 500
  const details =
    !isProd && statusCode !== 500
      ? { name: err.name, cause: (err as any).cause }
      : undefined;

  return {
    statusCode,
    body: {
      error: {
        code,
        message,
        details,
        requestId,
      } satisfies ErrorInfo,
    },
  };
}

const plugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((err, req, reply) => {
    const requestId = req.id?.toString();
    const isProd = (app.config?.NODE_ENV ?? "development") === "production";

    // Always log full error server-side
    req.log.error({ err }, "request failed");

    const { statusCode, body } = toErrorEnvelope(
      err as FastifyError,
      requestId,
      isProd,
    );
    reply.code(statusCode).send(body);
  });
};

export default fp(plugin);
