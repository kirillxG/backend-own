"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successEnvelope = exports.errorEnvelopeSchema = exports.errorInfoSchema = void 0;
exports.errorInfoSchema = {
    $id: "errorInfo",
    type: "object",
    additionalProperties: false,
    required: ["code", "message"],
    properties: {
        code: { type: "string" },
        message: { type: "string" },
        details: {},
        requestId: { type: "string" },
    },
};
exports.errorEnvelopeSchema = {
    $id: "errorEnvelope",
    type: "object",
    additionalProperties: false,
    required: ["error"],
    properties: {
        error: { $ref: "errorInfo#" },
    },
};
const successEnvelope = (dataRef) => ({
    type: "object",
    additionalProperties: false,
    required: ["data"],
    properties: {
        data: { $ref: dataRef },
    },
});
exports.successEnvelope = successEnvelope;
