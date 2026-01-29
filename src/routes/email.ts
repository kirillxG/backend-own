import type { FastifyPluginAsync } from "fastify";
import crypto from "crypto";
import { successEnvelope } from "../schemas/envelope";
import {
  setEmailBodySchema,
  verifyEmailBodySchema,
  emailStatusSchema,
} from "../schemas/email";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url"); // URL-safe
}

const route: FastifyPluginAsync = async (app) => {
  app.addSchema(setEmailBodySchema);
  app.addSchema(verifyEmailBodySchema);
  app.addSchema(emailStatusSchema);

  const pre = [app.auth];

  // GET /v1/account/email (status)
  app.get(
    "/account/email",
    {
      preHandler: pre,
      schema: {
        response: {
          200: successEnvelope("emailStatus#"),
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const userId = req.authUser!.id;

      const r = await app.pg.query(
        `
        SELECT email, email_verified_at, email_pending
        FROM user_credentials
        WHERE user_id = $1
        `,
        [userId],
      );

      if (r.rowCount === 0)
        throw app.httpErrors.notFound("Credentials not found");

      const row = r.rows[0];
      return {
        email: row.email ?? null,
        emailVerified: row.email_verified_at != null,
        emailPending: row.email_pending ?? null,
      };
    },
  );

  // POST /v1/account/email (set pending email + create token)
  app.post(
    "/account/email",
    {
      preHandler: pre,
      schema: {
        body: { $ref: "setEmailBody#" },
        response: {
          200: successEnvelope({
            type: "object",
            additionalProperties: false,
            required: ["emailPending"],
            properties: {
              emailPending: { type: "string" },

              // dev-only field (optional): you can remove later when real email sending exists
              verificationToken: { type: "string" },
            },
          }),
          409: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const userId = req.authUser!.id;
      const { email } = req.body as any;

      const token = randomToken();
      const tokenHash = sha256(token);

      const expiresMinutes = 30;
      const expiresAt = new Date(Date.now() + expiresMinutes * 60_000);

      const c = await app.pg.connect();
      try {
        await c.query("BEGIN");

        // Ensure credential row exists
        const cred = await c.query(
          `SELECT user_id FROM user_credentials WHERE user_id=$1`,
          [userId],
        );
        if (cred.rowCount === 0)
          throw app.httpErrors.notFound("Credentials not found");

        // Set pending email (unique constraint on email_pending will enforce uniqueness)
        try {
          await c.query(
            `
            UPDATE user_credentials
            SET email_pending = $2
            WHERE user_id = $1
            `,
            [userId, email],
          );
        } catch (e: any) {
          if (e?.code === "23505")
            throw app.httpErrors.conflict("Email already in use");
          throw e;
        }

        // Upsert token row (rotate token on each request)
        try {
          await c.query(
            `
            INSERT INTO email_verification_tokens (user_id, token_hash, email, expires_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id)
            DO UPDATE SET token_hash = EXCLUDED.token_hash,
                          email = EXCLUDED.email,
                          expires_at = EXCLUDED.expires_at,
                          created_at = now()
            `,
            [userId, tokenHash, email, expiresAt],
          );
        } catch (e: any) {
          if (e?.code === "23505")
            throw app.httpErrors.conflict("Email already in use");
          throw e;
        }

        await c.query("COMMIT");

        // In production, you would email `token` to `email`.
        // For now return it so you can verify manually.
        return { emailPending: email, verificationToken: token };
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    },
  );

  // POST /v1/account/email/verify (promote pending email to verified)
  app.post(
    "/account/email/verify",
    {
      preHandler: pre,
      schema: {
        body: { $ref: "verifyEmailBody#" },
        response: {
          200: successEnvelope("emailStatus#"),
          400: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const userId = req.authUser!.id;
      const { token } = req.body as any;

      const tokenHash = sha256(token);

      const c = await app.pg.connect();
      try {
        await c.query("BEGIN");

        const t = await c.query(
          `
          SELECT email, expires_at
          FROM email_verification_tokens
          WHERE user_id = $1 AND token_hash = $2
          `,
          [userId, tokenHash],
        );

        if (t.rowCount === 0) throw app.httpErrors.badRequest("Invalid token");

        const { email, expires_at } = t.rows[0];
        if (new Date(expires_at).getTime() < Date.now())
          throw app.httpErrors.badRequest("Token expired");

        // Promote email_pending -> email and mark verified
        // Also clear pending
        try {
          await c.query(
            `
            UPDATE user_credentials
            SET
              email = $2,
              email_pending = NULL,
              email_verified_at = now()
            WHERE user_id = $1
            `,
            [userId, email],
          );
        } catch (e: any) {
          if (e?.code === "23505")
            throw app.httpErrors.conflict("Email already in use");
          throw e;
        }

        // Consume token
        await c.query(
          `DELETE FROM email_verification_tokens WHERE user_id = $1`,
          [userId],
        );

        await c.query("COMMIT");

        // Return current status
        const r = await app.pg.query(
          `
          SELECT email, email_verified_at, email_pending
          FROM user_credentials
          WHERE user_id = $1
          `,
          [userId],
        );

        const row = r.rows[0];
        return {
          email: row.email ?? null,
          emailVerified: row.email_verified_at != null,
          emailPending: row.email_pending ?? null,
        };
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    },
  );
};

export default route;
