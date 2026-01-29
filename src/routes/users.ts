import type { FastifyPluginAsync } from "fastify";
import { successEnvelope } from "../schemas/envelope";
import { publicUserSchema, meSchema } from "../schemas/users";

function toPublicUser(row: any) {
  return {
    id: String(row.id),
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
  };
}

const route: FastifyPluginAsync = async (app) => {
  app.addSchema(publicUserSchema);
  app.addSchema(meSchema);

  // /me should be authenticated
  const authOnly = [app.auth];

  // /users should be restricted. Prefer RBAC.
  const adminOnly = app.guard
    ? [app.auth, app.guard({ permission: "user:read" })]
    : [app.auth];

  // GET /v1/me
  // Returns current user + credentials based on HttpOnly cookie.
  app.get(
    "/me",
    {
      preHandler: authOnly,
      schema: {
        response: {
          200: successEnvelope("me#"),
          401: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const userId = req.authUser!.id;

      const r = await app.pg.query(
        `
        SELECT
          u.id, u.display_name, u.avatar_url, u.created_at,
          uc.login_name, uc.email
        FROM users u
        JOIN user_credentials uc ON uc.user_id = u.id
        WHERE u.id = $1
        `,
        [userId],
      );

      if (r.rowCount === 0) throw app.httpErrors.notFound("User not found");

      const row = r.rows[0];
      return {
        user: toPublicUser(row),
        credentials: {
          loginName: row.login_name,
          email: row.email ?? null,
        },
      };
    },
  );

  // GET /v1/users  (restricted)
  app.get(
    "/users",
    {
      preHandler: adminOnly,
      schema: {
        response: {
          200: successEnvelope({
            type: "array",
            items: { $ref: "publicUser#" },
          }),
          401: { $ref: "errorEnvelope#" },
          403: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async () => {
      const r = await app.pg.query(
        `
        SELECT id, display_name, avatar_url, created_at
        FROM users
        ORDER BY id ASC
        `,
      );

      return r.rows.map(toPublicUser);
    },
  );
};

export default route;
