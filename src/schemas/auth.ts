export const registerBodySchema = {
  $id: "registerBody",
  type: "object",
  additionalProperties: false,
  required: ["loginName", "email", "password"],
  properties: {
    loginName: {
      type: "string",
      minLength: 3,
      maxLength: 32,
      pattern: "^[a-zA-Z0-9_]+$",
    },
    email: { type: "string", format: "email", maxLength: 254 },
    password: { type: "string", minLength: 4, maxLength: 200 },
  },
} as const;

export const loginBodySchema = {
  $id: "loginBody",
  type: "object",
  additionalProperties: false,
  required: ["identifier", "password"],
  properties: {
    identifier: { type: "string", minLength: 3, maxLength: 254 },
    password: { type: "string", minLength: 1, maxLength: 200 },
  },
} as const;

export const authDataSchema = {
  $id: "authData",
  type: "object",
  additionalProperties: false,
  required: ["user"],
  properties: {
    user: {
      type: "object",
      additionalProperties: false,
      required: ["id", "displayName"],
      properties: {
        id: { type: "string" },
        displayName: { type: "string" },
        avatarUrl: { type: "string" },
      },
    },
  },
} as const;
