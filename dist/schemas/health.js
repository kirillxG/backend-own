"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthDataSchema = void 0;
exports.healthDataSchema = {
    $id: "healthData",
    type: "object",
    additionalProperties: false,
    required: ["status"],
    properties: { status: { type: "string" } },
};
