import type { FastifyPluginAsync } from "fastify";
import argon2 from "argon2";
import { successEnvelope } from "../schemas/envelope";
import {
  registerBodySchema,
  loginBodySchema,
  authDataSchema,
} from "../schemas/auth";

function toUser(row: any) {
  return {
    id: String(row.id),
    email: row.email,
    displayName: row.display_name ?? undefined,
  };
}

const route: FastifyPluginAsync = async (app) => {
  app.addSchema(registerBodySchema);
  app.addSchema(loginBodySchema);
  app.addSchema(authDataSchema);

  // POST /v1/auth/register
  app.post(
    "/auth/register",
    {
      schema: {
        body: { $ref: "registerBody#" },
        response: {
          200: successEnvelope("authData#"),
          400: { $ref: "errorEnvelope#" },
          409: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { email, password, displayName } = req.body as any;

      const passwordHash = await argon2.hash(password);

      const c = await app.pg.connect();
      try {
        await c.query("BEGIN");

        // Create user
        let userRow;
        try {
          const r1 = await c.query(
            `INSERT INTO users (email, display_name)
             VALUES ($1, $2)
             RETURNING id, email, display_name`,
            [email, displayName ?? null],
          );
          userRow = r1.rows[0];
        } catch (e: any) {
          // Unique violation
          if (e?.code === "23505")
            throw app.httpErrors.conflict("Email already registered");
          throw e;
        }

        // Create credentials
        await c.query(
          `INSERT INTO user_credentials (user_id, password_hash)
           VALUES ($1, $2)`,
          [userRow.id, passwordHash],
        );

        await c.query("COMMIT");

        const user = toUser(userRow);
        const accessToken = await (app as any).jwt.sign({ sub: user.id });

        return { accessToken, user };
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    },
  );

  // POST /v1/auth/login
  app.post(
    "/auth/login",
    {
      schema: {
        body: { $ref: "loginBody#" },
        response: {
          200: successEnvelope("authData#"),
          400: { $ref: "errorEnvelope#" },
          401: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { email, password } = req.body as any;

      const r = await app.pg.query(
        `SELECT u.id, u.email, u.display_name, uc.password_hash
         FROM users u
         JOIN user_credentials uc ON uc.user_id = u.id
         WHERE u.email = $1`,
        [email],
      );

      if (r.rowCount === 0) {
        throw app.httpErrors.unauthorized("Invalid email or password");
      }

      const row = r.rows[0];
      const ok = await argon2.verify(row.password_hash, password);
      if (!ok) {
        throw app.httpErrors.unauthorized("Invalid email or password");
      }

      const user = toUser(row);
      const accessToken = await (app as any).jwt.sign({ sub: user.id });

      return { accessToken, user };
    },
  );
};

export default route;
