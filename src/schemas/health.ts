export const healthDataSchema = {
  $id: "healthData",
  type: "object",
  additionalProperties: false,
  required: ["status"],
  properties: { status: { type: "string" } },
} as const;
