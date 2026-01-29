export const setEmailBodySchema = {
  $id: "setEmailBody",
  type: "object",
  additionalProperties: false,
  required: ["email"],
  properties: {
    email: { type: "string", format: "email", maxLength: 254 },
  },
} as const;

export const verifyEmailBodySchema = {
  $id: "verifyEmailBody",
  type: "object",
  additionalProperties: false,
  required: ["token"],
  properties: {
    token: { type: "string", minLength: 20, maxLength: 200 },
  },
} as const;

export const emailStatusSchema = {
  $id: "emailStatus",
  type: "object",
  additionalProperties: false,
  required: ["email", "emailVerified", "emailPending"],
  properties: {
    email: { type: ["string", "null"] },
    emailVerified: { type: "boolean" },
    emailPending: { type: ["string", "null"] },
  },
} as const;
