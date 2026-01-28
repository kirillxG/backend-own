"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const health_1 = require("../schemas/health");
const envelope_1 = require("../schemas/envelope");
const route = async (app) => {
    app.addSchema(health_1.healthDataSchema);
    app.get("/health", {
        schema: {
            response: {
                200: (0, envelope_1.successEnvelope)("healthData#"),
                400: { $ref: "errorEnvelope#" },
                500: { $ref: "errorEnvelope#" },
            },
        },
    }, async () => {
        return { status: "ok" }; // MUST be raw domain object
    });
};
exports.default = route;
