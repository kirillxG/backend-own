export const registerBodySchema = {
  $id: "registerBody",
  type: "object",
  additionalProperties: false,
  required: ["email", "password"],
  properties: {
    email: { type: "string", format: "email", minLength: 3, maxLength: 320 },
    password: { type: "string", minLength: 10, maxLength: 200 },
    displayName: { type: "string", minLength: 1, maxLength: 80 },
  },
} as const;

export const loginBodySchema = {
  $id: "loginBody",
  type: "object",
  additionalProperties: false,
  required: ["email", "password"],
  properties: {
    email: { type: "string", format: "email", minLength: 3, maxLength: 320 },
    password: { type: "string", minLength: 1, maxLength: 200 },
  },
} as const;

export const authDataSchema = {
  $id: "authData",
  type: "object",
  additionalProperties: false,
  required: ["accessToken", "user", "displayName"],
  properties: {
    accessToken: { type: "string" },
    user: {
      type: "object",
      additionalProperties: false,
      required: ["id", "email"],
      properties: {
        id: { type: "string" }, // serialize bigint as string
        email: { type: "string" },
        displayName: { type: "string" },
      },
    },
  },
} as const;
