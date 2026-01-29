export const commentSchema = {
  $id: "comment",
  type: "object",
  additionalProperties: false,
  required: ["id", "postId", "authorId", "body", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string" },
    postId: { type: "string" },
    authorId: { type: "string" },
    body: { type: "string" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
    deletedAt: { type: "string" },
  },
} as const;

export const createCommentBodySchema = {
  $id: "createCommentBody",
  type: "object",
  additionalProperties: false,
  required: ["body"],
  properties: {
    body: { type: "string", minLength: 1, maxLength: 10_000 },
  },
} as const;

export const updateCommentBodySchema = {
  $id: "updateCommentBody",
  type: "object",
  additionalProperties: false,
  properties: {
    body: { type: "string", minLength: 1, maxLength: 10_000 },
  },
} as const;

export const listCommentsQuerySchema = {
  $id: "listCommentsQuery",
  type: "object",
  additionalProperties: false,
  properties: {
    includeDeleted: { type: "boolean", default: false },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
    offset: { type: "integer", minimum: 0, default: 0 },
  },
} as const;
