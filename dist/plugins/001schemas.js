"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const envelope_1 = require("../schemas/envelope");
const plugin = async (app) => {
    app.addSchema(envelope_1.errorInfoSchema);
    app.addSchema(envelope_1.errorEnvelopeSchema);
};
exports.default = (0, fastify_plugin_1.default)(plugin);
