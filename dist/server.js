"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const app = (0, app_1.buildApp)();
async function start() {
    await app.ready();
    const env = app.config; // provided by @fastify/env
    await app.listen({ port: env.PORT, host: env.HOST });
}
start().catch((err) => {
    app.log.error(err);
    process.exit(1);
});
