export const roleSchema = {
  $id: "role",
  type: "object",
  additionalProperties: false,
  required: ["id", "name"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
  },
} as const;

export const permissionSchema = {
  $id: "permission",
  type: "object",
  additionalProperties: false,
  required: ["id", "key"],
  properties: {
    id: { type: "string" },
    key: { type: "string" },
  },
} as const;

export const roleWithPermissionsSchema = {
  $id: "roleWithPermissions",
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "permissions"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    permissions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "key"],
        properties: {
          id: { type: "string" },
          key: { type: "string" },
        },
      },
    },
  },
} as const;

export const createRoleBodySchema = {
  $id: "createRoleBody",
  type: "object",
  additionalProperties: false,
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 2, maxLength: 64 },
  },
} as const;

export const updateRoleBodySchema = {
  $id: "updateRoleBody",
  type: "object",
  additionalProperties: false,
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 2, maxLength: 64 },
  },
} as const;

export const createPermissionBodySchema = {
  $id: "createPermissionBody",
  type: "object",
  additionalProperties: false,
  required: ["key"],
  properties: {
    key: { type: "string", minLength: 3, maxLength: 128 },
  },
} as const;

export const updatePermissionBodySchema = {
  $id: "updatePermissionBody",
  type: "object",
  additionalProperties: false,
  required: ["key"],
  properties: {
    key: { type: "string", minLength: 3, maxLength: 128 },
  },
} as const;

export const setRolePermissionsBodySchema = {
  $id: "setRolePermissionsBody",
  type: "object",
  additionalProperties: false,
  required: ["permissionIds"],
  properties: {
    permissionIds: { type: "array", items: { type: "string" }, minItems: 0 },
  },
} as const;
