export const postSchema = {
  $id: "post",
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "authorId",
    "title",
    "body",
    "createdAt",
    "updatedAt",
    "commentsCount",
    "likesCount",
    "likedByMe",
  ],
  properties: {
    id: { type: "string" },
    authorId: { type: "string" },
    title: { type: "string" },
    body: { type: "string" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
    deletedAt: { type: "string" },

    commentsCount: { type: "integer" },
    likesCount: { type: "integer" },
    likedByMe: { type: "boolean" },
  },
} as const;

export const createPostBodySchema = {
  $id: "createPostBody",
  type: "object",
  additionalProperties: false,
  required: ["title", "body"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    body: { type: "string", minLength: 1, maxLength: 50_000 },
  },
} as const;

export const updatePostBodySchema = {
  $id: "updatePostBody",
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    body: { type: "string", minLength: 1, maxLength: 50_000 },
  },
} as const;

export const listPostsQuerySchema = {
  $id: "listPostsQuery",
  type: "object",
  additionalProperties: false,
  properties: {
    includeDeleted: { type: "boolean", default: false },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    offset: { type: "integer", minimum: 0, default: 0 },
  },
} as const;
