"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
function toErrorEnvelope(err, requestId, isProd) {
    // Validation errors: safe to expose shape, but not stack
    if (err.validation) {
        return {
            statusCode: 400,
            body: {
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Request validation failed",
                    details: err.validation,
                    requestId,
                },
            },
        };
    }
    const statusCode = typeof err.statusCode === "number" && err.statusCode >= 400
        ? err.statusCode
        : 500;
    // Never leak internal messages for 500 in prod
    const message = statusCode === 500 && isProd
        ? "Internal Server Error"
        : err.message || "Error";
    const code = err.code ?? (statusCode === 500 ? "INTERNAL_ERROR" : `HTTP_${statusCode}`);
    // Optional details only when not prod AND not 500
    const details = !isProd && statusCode !== 500
        ? { name: err.name, cause: err.cause }
        : undefined;
    return {
        statusCode,
        body: {
            error: {
                code,
                message,
                details,
                requestId,
            },
        },
    };
}
const plugin = async (app) => {
    app.setErrorHandler((err, req, reply) => {
        const requestId = req.id?.toString();
        const isProd = (app.config?.NODE_ENV ?? "development") === "production";
        // Always log full error server-side
        req.log.error({ err }, "request failed");
        const { statusCode, body } = toErrorEnvelope(err, requestId, isProd);
        reply.code(statusCode).send(body);
    });
};
exports.default = (0, fastify_plugin_1.default)(plugin);
