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
  required: ["user"],
  properties: {
    user: { $ref: "publicUser#" },
  },
} as const;
