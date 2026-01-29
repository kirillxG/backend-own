export const publicUserSchema = {
  $id: "publicUser",
  type: "object",
  additionalProperties: false,
  required: ["id", "displayName", "createdAt"],
  properties: {
    id: { type: "string" },
    displayName: { type: "string" },
    avatarUrl: { type: "string" },
    createdAt: { type: "string" },
  },
} as const;

export const meSchema = {
  $id: "me",
  type: "object",
  additionalProperties: false,
  required: ["user", "credentials"],
  properties: {
    user: { $ref: "publicUser#" },
    credentials: {
      type: "object",
      additionalProperties: false,
      required: ["loginName", "email"],
      properties: {
        loginName: { type: "string" },
        email: { type: ["string", "null"] },
      },
    },
  },
} as const;
