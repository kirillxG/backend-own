export const likesCountSchema = {
  $id: "likesCount",
  type: "object",
  additionalProperties: false,
  required: ["postId", "count"],
  properties: {
    postId: { type: "string" },
    count: { type: "integer" },
  },
} as const;

export const likeStatusSchema = {
  $id: "likeStatus",
  type: "object",
  additionalProperties: false,
  required: ["postId", "liked"],
  properties: {
    postId: { type: "string" },
    liked: { type: "boolean" },
  },
} as const;
