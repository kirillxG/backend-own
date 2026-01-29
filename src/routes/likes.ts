import type { FastifyPluginAsync } from "fastify";
import { successEnvelope } from "../schemas/envelope";
import { likesCountSchema, likeStatusSchema } from "../schemas/likes";

const route: FastifyPluginAsync = async (app) => {
  app.addSchema(likesCountSchema);
  app.addSchema(likeStatusSchema);

  const pre = (perm: string) => [app.auth, app.guard({ permission: perm })];

  // POST /v1/posts/:postId/like  (idempotent)
  app.post(
    "/posts/:postId/like",
    {
      preHandler: pre("like:create"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["postId"],
          properties: { postId: { type: "string" } },
        },
        response: {
          200: successEnvelope("likeStatus#"),
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { postId } = req.params as any;
      const userId = req.authUser!.id;

      const p = await app.pg.query(
        "SELECT id FROM posts WHERE id=$1 AND deleted_at IS NULL",
        [postId],
      );
      if (p.rowCount === 0) throw app.httpErrors.notFound("Post not found");

      await app.pg.query(
        `
        INSERT INTO post_likes (post_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
        [postId, userId],
      );

      return { postId: String(postId), liked: true };
    },
  );

  // DELETE /v1/posts/:postId/like  (idempotent)
  app.delete(
    "/posts/:postId/like",
    {
      preHandler: pre("like:delete"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["postId"],
          properties: { postId: { type: "string" } },
        },
        response: {
          200: successEnvelope("likeStatus#"),
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { postId } = req.params as any;
      const userId = req.authUser!.id;

      const p = await app.pg.query(
        "SELECT id FROM posts WHERE id=$1 AND deleted_at IS NULL",
        [postId],
      );
      if (p.rowCount === 0) throw app.httpErrors.notFound("Post not found");

      await app.pg.query(
        `DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2`,
        [postId, userId],
      );

      return { postId: String(postId), liked: false };
    },
  );

  // GET /v1/posts/:postId/likes/count
  app.get(
    "/posts/:postId/likes/count",
    {
      preHandler: pre("like:read"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["postId"],
          properties: { postId: { type: "string" } },
        },
        response: {
          200: successEnvelope("likesCount#"),
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { postId } = req.params as any;

      const p = await app.pg.query(
        "SELECT id FROM posts WHERE id=$1 AND deleted_at IS NULL",
        [postId],
      );
      if (p.rowCount === 0) throw app.httpErrors.notFound("Post not found");

      const r = await app.pg.query(
        `SELECT COUNT(*)::int AS count FROM post_likes WHERE post_id=$1`,
        [postId],
      );

      return { postId: String(postId), count: r.rows[0].count };
    },
  );

  // GET /v1/posts/:postId/likes/me  (did current user like it?)
  app.get(
    "/posts/:postId/likes/me",
    {
      preHandler: pre("like:read"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["postId"],
          properties: { postId: { type: "string" } },
        },
        response: {
          200: successEnvelope("likeStatus#"),
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { postId } = req.params as any;
      const userId = req.authUser!.id;

      const p = await app.pg.query(
        "SELECT id FROM posts WHERE id=$1 AND deleted_at IS NULL",
        [postId],
      );
      if (p.rowCount === 0) throw app.httpErrors.notFound("Post not found");

      const r = await app.pg.query(
        `SELECT 1 FROM post_likes WHERE post_id=$1 AND user_id=$2`,
        [postId, userId],
      );

      return { postId: String(postId), liked: r.rowCount > 0 };
    },
  );
};

export default route;
