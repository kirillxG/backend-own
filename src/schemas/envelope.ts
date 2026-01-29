export const errorInfoSchema = {
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
} as const;

export const errorEnvelopeSchema = {
  $id: "errorEnvelope",
  type: "object",
  additionalProperties: false,
  required: ["error"],
  properties: {
    error: { $ref: "errorInfo#" },
  },
} as const;

export const successEnvelope = (data: any) =>
  ({
    type: "object",
    additionalProperties: false,
    required: ["data"],
    properties: { data: typeof data === "string" ? { $ref: data } : data },
  }) as const;
