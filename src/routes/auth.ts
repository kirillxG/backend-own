import type { FastifyPluginAsync } from "fastify";
import argon2 from "argon2";
import { successEnvelope } from "../schemas/envelope";
import {
  registerBodySchema,
  loginBodySchema,
  authDataSchema,
} from "../schemas/auth";
import crypto from "crypto";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

function toUser(row: any) {
  return {
    id: String(row.id),
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
  };
}

function cookieOptions(app: any, remember: boolean) {
  const isProd = app.config.NODE_ENV === "production";
  console.log(remember ? THIRTY_DAYS_SECONDS : undefined);
  return {
    signed: true,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: remember ? THIRTY_DAYS_SECONDS : undefined,
  };
}

function newJti() {
  return crypto.randomBytes(32).toString("base64url");
}
function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
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
      const { email, password, loginName } = req.body as any;

      const passwordHash = await argon2.hash(password);

      const c = await app.pg.connect();
      try {
        await c.query("BEGIN");

        // Create user (identity)
        const rUser = await c.query(
          `
          INSERT INTO users (display_name)
          VALUES ($1)
          RETURNING id, display_name, avatar_url
          `,
          [loginName],
        );

        const userRow = rUser.rows[0];

        // Create credentials (auth)
        try {
          await c.query(
            `
  INSERT INTO user_credentials (user_id, login_name, email, password_hash)
  VALUES ($1, $2, $3, $4)
  `,
            [userRow.id, loginName, email ?? null, passwordHash],
          );
        } catch (e: any) {
          if (e?.code === "23505")
            throw app.httpErrors.conflict(
              "Email or loginName already registered",
            );
          throw e;
        }

        await c.query("COMMIT");

        return { ok: true };
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    },
  );

  // POST /v1/auth/login
  // Accept "identifier" (email OR loginName). If your schema still says "email", keep it but treat it as identifier.
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
    async (req, reply) => {
      const { identifier, password, remember } = req.body as any;

      const r = await app.pg.query(
        `
  SELECT
    u.id,
    u.display_name,
    u.avatar_url,
    uc.password_hash
  FROM user_credentials uc
  JOIN users u ON u.id = uc.user_id
  WHERE uc.email = $1 OR uc.login_name = $1
  `,
        [identifier],
      );

      if (r.rowCount === 0)
        throw app.httpErrors.unauthorized("Invalid credentials");

      const row = r.rows[0];
      const ok = await argon2.verify(row.password_hash, password);
      if (!ok) throw app.httpErrors.unauthorized("Invalid credentials");

      const user = toUser(row);
      const token = await (app as any).jwt.sign({ sub: user.id });
      reply.setCookie(
        app.config.COOKIE_NAME,
        token,
        cookieOptions(app, remember),
      );

      return { user };
    },
  );

  // POST /v1/auth/logout
  app.post(
    "/auth/logout",
    {
      schema: {
        response: {
          200: successEnvelope({
            type: "object",
            additionalProperties: false,
            required: ["ok"],
            properties: { ok: { type: "boolean" } },
          }),
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (_req, reply) => {
      reply.clearCookie(app.config.COOKIE_NAME, { path: "/" });
      return { ok: true };
    },
  );
};

export default route;
