"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
function isObject(x) {
    return typeof x === "object" && x !== null;
}
const plugin = async (app) => {
    app.setReplySerializer((payload, statusCode) => {
        if (payload === undefined)
            return "";
        if (isObject(payload) && ("data" in payload || "error" in payload)) {
            // Success handlers must NOT return envelopes; this prevents “random style” drift.
            // Errors are produced only by the global error handler.
            if (statusCode >= 200 && statusCode < 300) {
                throw app.httpErrors.internalServerError("Handler returned an envelope. Return the raw domain object and let the framework wrap it.");
            }
            return JSON.stringify(payload);
        }
        if (statusCode >= 200 && statusCode < 300) {
            return JSON.stringify({ data: payload });
        }
        return JSON.stringify(payload);
    });
};
exports.default = (0, fastify_plugin_1.default)(plugin);
