"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const autoload_1 = __importDefault(require("@fastify/autoload"));
const node_path_1 = __importDefault(require("node:path"));
function buildApp() {
    const app = (0, fastify_1.default)({ logger: true });
    // Plugins first
    app.register(autoload_1.default, {
        dir: node_path_1.default.join(__dirname, "plugins"),
    });
    // Routes after plugins (schemas, envelope, error handler must be ready)
    app.register(autoload_1.default, {
        dir: node_path_1.default.join(__dirname, "routes"),
        options: { prefix: "/v1" },
    });
    return app;
}
