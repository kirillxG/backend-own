import type { FastifyPluginAsync } from "fastify";
import { successEnvelope } from "../schemas/envelope";
import {
  postSchema,
  createPostBodySchema,
  updatePostBodySchema,
  listPostsQuerySchema,
} from "../schemas/posts";

function toPost(row: any) {
  return {
    id: String(row.id),
    authorId: String(row.author_id),
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

const route: FastifyPluginAsync = async (app) => {
  app.addSchema(postSchema);
  app.addSchema(createPostBodySchema);
  app.addSchema(updatePostBodySchema);
  app.addSchema(listPostsQuerySchema);

  const pre = (perm: string) => [app.auth, app.guard({ permission: perm })];

  // POST /v1/posts
  app.post(
    "/posts",
    {
      preHandler: pre("post:create"),
      schema: {
        body: { $ref: "createPostBody#" },
        response: {
          200: successEnvelope("post#"),
          400: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { title, body } = req.body as any;
      const authorId = req.authUser!.id;

      const r = await app.pg.query(
        `
        INSERT INTO posts (author_id, title, body)
        VALUES ($1, $2, $3)
        RETURNING id, author_id, title, body, created_at, updated_at, deleted_at
        `,
        [authorId, title, body],
      );

      return toPost(r.rows[0]);
    },
  );

  // GET /v1/posts?limit=&offset=&includeDeleted=
  app.get(
    "/posts",
    {
      preHandler: pre("post:read"),
      schema: {
        querystring: { $ref: "listPostsQuery#" },
        response: {
          200: successEnvelope({ type: "array", items: { $ref: "post#" } }),
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const {
        limit = 20,
        offset = 0,
        includeDeleted = false,
      } = (req.query ?? {}) as any;

      const where = includeDeleted ? "" : "WHERE deleted_at IS NULL";

      const r = await app.pg.query(
        `
        SELECT id, author_id, title, body, created_at, updated_at, deleted_at
        FROM posts
        ${where}
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset],
      );

      return r.rows.map(toPost);
    },
  );

  // GET /v1/posts/:id
  app.get(
    "/posts/:id",
    {
      preHandler: pre("post:read"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: {
          200: successEnvelope("post#"),
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { id } = req.params as any;

      const r = await app.pg.query(
        `
        SELECT id, author_id, title, body, created_at, updated_at, deleted_at
        FROM posts
        WHERE id = $1 AND deleted_at IS NULL
        `,
        [id],
      );

      if (r.rowCount === 0) throw app.httpErrors.notFound("Post not found");
      return toPost(r.rows[0]);
    },
  );

  // PATCH /v1/posts/:id
  app.patch(
    "/posts/:id",
    {
      preHandler: pre("post:update"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: { $ref: "updatePostBody#" },
        response: {
          200: successEnvelope("post#"),
          400: { $ref: "errorEnvelope#" },
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { id } = req.params as any;
      const { title, body } = req.body as any;

      if (title === undefined && body === undefined) {
        throw app.httpErrors.badRequest("Nothing to update");
      }

      const authorId = req.authUser!.id;

      const r = await app.pg.query(
        `
  UPDATE posts
  SET
    title = COALESCE($3, title),
    body  = COALESCE($4, body),
    updated_at = now()
  WHERE id = $1
    AND author_id = $2
    AND deleted_at IS NULL
  RETURNING id, author_id, title, body, created_at, updated_at, deleted_at
  `,
        [id, authorId, title ?? null, body ?? null],
      );

      if (r.rowCount === 0) throw app.httpErrors.notFound("Post not found");
      return toPost(r.rows[0]);
    },
  );

  // DELETE /v1/posts/:id  (soft delete)
  app.delete(
    "/posts/:id",
    {
      preHandler: pre("post:delete"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["id"],
          properties: { id: { type: "string" } },
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
      const { id } = req.params as any;

      const authorId = req.authUser!.id;

      const r = await app.pg.query(
        `
  UPDATE posts
  SET deleted_at = now(), updated_at = now()
  WHERE id = $1
    AND author_id = $2
    AND deleted_at IS NULL
  `,
        [id, authorId],
      );

      if (r.rowCount === 0) throw app.httpErrors.notFound("Post not found");
      return { ok: true };
    },
  );
};

export default route;
