"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const env_1 = __importDefault(require("@fastify/env"));
const schema = {
    type: "object",
    required: ["PORT", "HOST"],
    properties: {
        NODE_ENV: { type: "string", default: "development" },
        PORT: { type: "integer", default: 3000 },
        HOST: { type: "string", default: "0.0.0.0" },
        DATABASE_URL: { type: "string" },
    },
};
const env = async (app) => {
    await app.register(env_1.default, {
        schema,
        dotenv: true, // reads .env if present
    });
};
exports.default = (0, fastify_plugin_1.default)(env);
