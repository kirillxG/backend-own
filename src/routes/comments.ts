import type { FastifyPluginAsync } from "fastify";
import { successEnvelope } from "../schemas/envelope";
import {
  commentSchema,
  createCommentBodySchema,
  updateCommentBodySchema,
  listCommentsQuerySchema,
} from "../schemas/comments";

function toComment(row: any) {
  return {
    id: String(row.id),
    postId: String(row.post_id),
    authorId: String(row.author_id),
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

const route: FastifyPluginAsync = async (app) => {
  app.addSchema(commentSchema);
  app.addSchema(createCommentBodySchema);
  app.addSchema(updateCommentBodySchema);
  app.addSchema(listCommentsQuerySchema);

  const pre = (perm: string) => [app.auth, app.guard({ permission: perm })];

  // POST /v1/posts/:postId/comments
  app.post(
    "/posts/:postId/comments",
    {
      preHandler: pre("comment:create"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["postId"],
          properties: { postId: { type: "string" } },
        },
        body: { $ref: "createCommentBody#" },
        response: {
          200: successEnvelope("comment#"),
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { postId } = req.params as any;
      const { body } = req.body as any;
      const authorId = req.authUser!.id;

      // Ensure post exists and is not deleted
      const p = await app.pg.query(
        "SELECT id FROM posts WHERE id=$1 AND deleted_at IS NULL",
        [postId],
      );
      if (p.rowCount === 0) throw app.httpErrors.notFound("Post not found");

      const r = await app.pg.query(
        `
        INSERT INTO comments (post_id, author_id, body)
        VALUES ($1, $2, $3)
        RETURNING id, post_id, author_id, body, created_at, updated_at, deleted_at
        `,
        [postId, authorId, body],
      );

      return toComment(r.rows[0]);
    },
  );

  // GET /v1/posts/:postId/comments
  app.get(
    "/posts/:postId/comments",
    {
      preHandler: pre("comment:read"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["postId"],
          properties: { postId: { type: "string" } },
        },
        querystring: { $ref: "listCommentsQuery#" },
        response: {
          200: successEnvelope({ type: "array", items: { $ref: "comment#" } }),
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { postId } = req.params as any;
      const {
        includeDeleted = false,
        limit = 50,
        offset = 0,
      } = (req.query ?? {}) as any;

      const p = await app.pg.query(
        "SELECT id FROM posts WHERE id=$1 AND deleted_at IS NULL",
        [postId],
      );
      if (p.rowCount === 0) throw app.httpErrors.notFound("Post not found");

      const where = includeDeleted ? "" : "AND c.deleted_at IS NULL";

      const r = await app.pg.query(
        `
        SELECT c.id, c.post_id, c.author_id, c.body, c.created_at, c.updated_at, c.deleted_at
        FROM comments c
        WHERE c.post_id = $1
        ${where}
        ORDER BY c.created_at ASC
        LIMIT $2 OFFSET $3
        `,
        [postId, limit, offset],
      );

      return r.rows.map(toComment);
    },
  );

  // PATCH /v1/posts/:postId/comments/:commentId (only author)
  app.patch(
    "/posts/:postId/comments/:commentId",
    {
      preHandler: pre("comment:update"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["postId", "commentId"],
          properties: {
            postId: { type: "string" },
            commentId: { type: "string" },
          },
        },
        body: { $ref: "updateCommentBody#" },
        response: {
          200: successEnvelope("comment#"),
          400: { $ref: "errorEnvelope#" },
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { postId, commentId } = req.params as any;
      const { body } = req.body as any;
      const authorId = req.authUser!.id;

      if (body === undefined)
        throw app.httpErrors.badRequest("Nothing to update");

      const r = await app.pg.query(
        `
        UPDATE comments
        SET body = $4, updated_at = now()
        WHERE id = $1
          AND post_id = $2
          AND author_id = $3
          AND deleted_at IS NULL
        RETURNING id, post_id, author_id, body, created_at, updated_at, deleted_at
        `,
        [commentId, postId, authorId, body],
      );

      if (r.rowCount === 0) throw app.httpErrors.notFound("Comment not found");
      return toComment(r.rows[0]);
    },
  );

  // DELETE /v1/posts/:postId/comments/:commentId (soft delete, only author)
  app.delete(
    "/posts/:postId/comments/:commentId",
    {
      preHandler: pre("comment:delete"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["postId", "commentId"],
          properties: {
            postId: { type: "string" },
            commentId: { type: "string" },
          },
        },
        response: {
          200: successEnvelope({
            type: "object",
            additionalProperties: false,
            required: ["ok"],
            properties: { ok: { type: "boolean" } },
          }),
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { postId, commentId } = req.params as any;
      const authorId = req.authUser!.id;

      const r = await app.pg.query(
        `
        UPDATE comments
        SET deleted_at = now(), updated_at = now()
        WHERE id = $1
          AND post_id = $2
          AND author_id = $3
          AND deleted_at IS NULL
        `,
        [commentId, postId, authorId],
      );

      if (r.rowCount === 0) throw app.httpErrors.notFound("Comment not found");
      return { ok: true };
    },
  );
};

export default route;
