"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const pg_1 = require("pg");
require("dotenv/config");
const plugin = async (app) => {
    const pool = new pg_1.Pool({
        connectionString: app.config.DATABASE_URL,
    });
    // quick sanity check early
    await pool.query("select 1 as ok");
    app.decorate("pg", pool);
    app.addHook("onClose", async () => {
        await pool.end();
    });
};
exports.default = (0, fastify_plugin_1.default)(plugin);
