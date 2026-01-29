import type { FastifyPluginAsync } from "fastify";
import { successEnvelope } from "../schemas/envelope";
import {
  roleSchema,
  permissionSchema,
  roleWithPermissionsSchema,
  createRoleBodySchema,
  updateRoleBodySchema,
  createPermissionBodySchema,
  updatePermissionBodySchema,
  setRolePermissionsBodySchema,
} from "../schemas/rbac";

function rowToRole(r: any) {
  return { id: String(r.id), name: r.name };
}
function rowToPerm(r: any) {
  return { id: String(r.id), key: r.key };
}

const route: FastifyPluginAsync = async (app) => {
  // Register schemas once
  app.addSchema(roleSchema);
  app.addSchema(permissionSchema);
  app.addSchema(roleWithPermissionsSchema);
  app.addSchema(createRoleBodySchema);
  app.addSchema(updateRoleBodySchema);
  app.addSchema(createPermissionBodySchema);
  app.addSchema(updatePermissionBodySchema);
  app.addSchema(setRolePermissionsBodySchema);

  // Hard gate helper
  const pre = (permission: string) => [app.auth, app.guard({ permission })];

  // ---------------- Roles CRUD ----------------

  // GET /v1/admin/rbac/roles
  app.get(
    "/admin/rbac/roles",
    {
      preHandler: pre("rbac:role:read"),
      schema: {
        response: {
          200: successEnvelope({
            $id: "rolesList",
            type: "array",
            items: { $ref: "role#" },
          } as any),
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async () => {
      const r = await app.pg.query(
        "SELECT id, name FROM roles ORDER BY name ASC",
      );
      return r.rows.map(rowToRole);
    },
  );

  app.get(
    "/admin/rbac/rolesv2",
    {
      preHandler: pre("rbac:role:read"),
      schema: {
        response: {
          200: successEnvelope({
            type: "array",
            items: { $ref: "roleWithPermissions#" },
          }),
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async () => {
      const r = await app.pg.query(`
      SELECT
        r.id,
        r.name,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', p.id::text, 'key', p.key)
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) AS permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      GROUP BY r.id, r.name
      ORDER BY r.name ASC;
    `);

      return r.rows.map((row: any) => ({
        id: String(row.id),
        name: row.name,
        permissions: row.permissions,
      }));
    },
  );

  // POST /v1/admin/rbac/roles
  app.post(
    "/admin/rbac/roles",
    {
      preHandler: pre("rbac:role:create"),
      schema: {
        body: { $ref: "createRoleBody#" },
        response: {
          200: successEnvelope("role#"),
          409: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { name } = req.body as any;
      try {
        const r = await app.pg.query(
          "INSERT INTO roles(name) VALUES ($1) RETURNING id, name",
          [name],
        );
        return rowToRole(r.rows[0]);
      } catch (e: any) {
        if (e?.code === "23505")
          throw app.httpErrors.conflict("Role name already exists");
        throw e;
      }
    },
  );

  // PUT /v1/admin/rbac/roles/:roleId
  app.put(
    "/admin/rbac/roles/:roleId",
    {
      preHandler: pre("rbac:role:update"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["roleId"],
          properties: { roleId: { type: "string" } },
        },
        body: { $ref: "updateRoleBody#" },
        response: {
          200: successEnvelope("role#"),
          404: { $ref: "errorEnvelope#" },
          409: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { roleId } = req.params as any;
      const { name } = req.body as any;

      try {
        const r = await app.pg.query(
          "UPDATE roles SET name=$1 WHERE id=$2 RETURNING id, name",
          [name, roleId],
        );
        if (r.rowCount === 0) throw app.httpErrors.notFound("Role not found");
        return rowToRole(r.rows[0]);
      } catch (e: any) {
        if (e?.code === "23505")
          throw app.httpErrors.conflict("Role name already exists");
        throw e;
      }
    },
  );

  // DELETE /v1/admin/rbac/roles/:roleId
  app.delete(
    "/admin/rbac/roles/:roleId",
    {
      preHandler: pre("rbac:role:delete"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["roleId"],
          properties: { roleId: { type: "string" } },
        },
        response: {
          200: successEnvelope({
            $id: "deleteOk",
            type: "object",
            additionalProperties: false,
            required: ["ok"],
            properties: { ok: { type: "boolean" } },
          } as any),
          400: { $ref: "errorEnvelope#" },
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { roleId } = req.params as any;

      // Protect yourself from deleting core roles if you want.
      // This is optional but usually sane.
      const core = await app.pg.query("SELECT name FROM roles WHERE id=$1", [
        roleId,
      ]);
      if (core.rowCount === 0) throw app.httpErrors.notFound("Role not found");
      if (core.rows[0].name === "admin")
        throw app.httpErrors.badRequest("Cannot delete admin role");

      const r = await app.pg.query("DELETE FROM roles WHERE id=$1", [roleId]);
      if (r.rowCount === 0) throw app.httpErrors.notFound("Role not found");
      return { ok: true };
    },
  );

  // ---------------- Permissions CRUD ----------------

  // GET /v1/admin/rbac/permissions
  app.get(
    "/admin/rbac/permissions",
    {
      preHandler: pre("rbac:permission:read"),
      schema: {
        response: {
          200: successEnvelope({
            $id: "permsList",
            type: "array",
            items: { $ref: "permission#" },
          } as any),
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async () => {
      const r = await app.pg.query(
        "SELECT id, key FROM permissions ORDER BY key ASC",
      );
      return r.rows.map(rowToPerm);
    },
  );

  // POST /v1/admin/rbac/permissions
  app.post(
    "/admin/rbac/permissions",
    {
      preHandler: pre("rbac:permission:create"),
      schema: {
        body: { $ref: "createPermissionBody#" },
        response: {
          200: successEnvelope("permission#"),
          409: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { key } = req.body as any;
      try {
        const r = await app.pg.query(
          "INSERT INTO permissions(key) VALUES ($1) RETURNING id, key",
          [key],
        );
        return rowToPerm(r.rows[0]);
      } catch (e: any) {
        if (e?.code === "23505")
          throw app.httpErrors.conflict("Permission key already exists");
        throw e;
      }
    },
  );

  // PUT /v1/admin/rbac/permissions/:permissionId
  app.put(
    "/admin/rbac/permissions/:permissionId",
    {
      preHandler: pre("rbac:permission:update"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["permissionId"],
          properties: { permissionId: { type: "string" } },
        },
        body: { $ref: "updatePermissionBody#" },
        response: {
          200: successEnvelope("permission#"),
          404: { $ref: "errorEnvelope#" },
          409: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { permissionId } = req.params as any;
      const { key } = req.body as any;

      try {
        const r = await app.pg.query(
          "UPDATE permissions SET key=$1 WHERE id=$2 RETURNING id, key",
          [key, permissionId],
        );
        if (r.rowCount === 0)
          throw app.httpErrors.notFound("Permission not found");
        return rowToPerm(r.rows[0]);
      } catch (e: any) {
        if (e?.code === "23505")
          throw app.httpErrors.conflict("Permission key already exists");
        throw e;
      }
    },
  );

  // DELETE /v1/admin/rbac/permissions/:permissionId
  app.delete(
    "/admin/rbac/permissions/:permissionId",
    {
      preHandler: pre("rbac:permission:delete"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["permissionId"],
          properties: { permissionId: { type: "string" } },
        },
        response: {
          200: successEnvelope({
            $id: "deleteOk2",
            type: "object",
            additionalProperties: false,
            required: ["ok"],
            properties: { ok: { type: "boolean" } },
          } as any),
          400: { $ref: "errorEnvelope#" },
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { permissionId } = req.params as any;

      // Deleting permissions can break authorization rules silently.
      // It's usually better to disallow deletes in prod; keeping here as requested.
      const r = await app.pg.query("DELETE FROM permissions WHERE id=$1", [
        permissionId,
      ]);
      if (r.rowCount === 0)
        throw app.httpErrors.notFound("Permission not found");
      return { ok: true };
    },
  );

  // ---------------- Assign permissions to a role ----------------

  // PUT /v1/admin/rbac/roles/:roleId/permissions
  // Sets the role's permission list to exactly permissionIds.
  app.put(
    "/admin/rbac/roles/:roleId/permissions",
    {
      preHandler: pre("rbac:role_permission:write"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["roleId"],
          properties: { roleId: { type: "string" } },
        },
        body: { $ref: "setRolePermissionsBody#" },
        response: {
          200: successEnvelope({
            $id: "rolePermsSetResp",
            type: "object",
            additionalProperties: false,
            required: ["roleId", "permissionIds"],
            properties: {
              roleId: { type: "string" },
              permissionIds: { type: "array", items: { type: "string" } },
            },
          } as any),
          400: { $ref: "errorEnvelope#" },
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { roleId } = req.params as any;
      const { permissionIds } = req.body as any;

      // Minimal input sanity: de-dupe
      const unique = Array.from(
        new Set((permissionIds as string[]).map(String)),
      );

      const c = await app.pg.connect();
      try {
        await c.query("BEGIN");

        const exists = await c.query("SELECT id, name FROM roles WHERE id=$1", [
          roleId,
        ]);
        if (exists.rowCount === 0)
          throw app.httpErrors.notFound("Role not found");
        if (exists.rows[0].name === "admin") {
          // Optional safety: don't let people lock themselves out of admin management accidentally
          // Remove this check if you want full control.
        }

        // Validate permissions exist
        if (unique.length > 0) {
          const r = await c.query(
            `SELECT id FROM permissions WHERE id = ANY($1::bigint[])`,
            [unique.map((x) => Number(x))],
          );
          if (r.rowCount !== unique.length) {
            throw app.httpErrors.badRequest(
              "One or more permissionIds do not exist",
            );
          }
        }

        // Replace set
        await c.query("DELETE FROM role_permissions WHERE role_id=$1", [
          roleId,
        ]);

        if (unique.length > 0) {
          await c.query(
            `
            INSERT INTO role_permissions(role_id, permission_id)
            SELECT $1::bigint, x::bigint
            FROM unnest($2::bigint[]) AS x
            ON CONFLICT DO NOTHING
            `,
            [Number(roleId), unique.map((x) => Number(x))],
          );
        }

        await c.query("COMMIT");
        return { roleId: String(roleId), permissionIds: unique };
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    },
  );

  // GET /v1/admin/rbac/roles/:roleId/permissions
  app.get(
    "/admin/rbac/roles/:roleId/permissions",
    {
      preHandler: pre("rbac:role:read"),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["roleId"],
          properties: { roleId: { type: "string" } },
        },
        response: {
          200: successEnvelope({
            $id: "rolePermsGetResp",
            type: "array",
            items: { $ref: "permission#" },
          } as any),
          404: { $ref: "errorEnvelope#" },
          500: { $ref: "errorEnvelope#" },
        },
      },
    },
    async (req) => {
      const { roleId } = req.params as any;

      const role = await app.pg.query("SELECT id FROM roles WHERE id=$1", [
        roleId,
      ]);
      if (role.rowCount === 0) throw app.httpErrors.notFound("Role not found");

      const r = await app.pg.query(
        `
        SELECT p.id, p.key
        FROM role_permissions rp
        JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = $1
        ORDER BY p.key ASC
        `,
        [roleId],
      );

      return r.rows.map(rowToPerm);
    },
  );
};

export default route;
