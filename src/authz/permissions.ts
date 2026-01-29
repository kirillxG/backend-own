import type { Pool } from "pg";

type Scope = { scopeType?: string | null; scopeId?: string | null };

function matchPermission(granted: string, required: string): boolean {
  if (granted === required) return true;

  const g = granted.split(":");
  const r = required.split(":");
  if (g.length === 0 || r.length === 0) return false;

  // Compare segment-by-segment.
  // '*' matches a single segment.
  const min = Math.min(g.length, r.length);

  for (let i = 0; i < min; i++) {
    if (g[i] === "*" || g[i] === r[i]) continue;
    return false;
  }

  // If granted is same length: it matched all segments.
  if (g.length === r.length) return true;

  // If granted is shorter, allow it only if its last segment is '*'
  // meaning "anything below this prefix".
  // Example: 'rbac:*' matches 'rbac:role:read'
  if (g.length < r.length) {
    return g[g.length - 1] === "*";
  }

  // If granted is longer than required, do not match.
  return false;
}

type CacheEntry = { perms: string[]; exp: number };
const cache = new Map<string, CacheEntry>();

export async function getUserPermissions(
  pool: Pool,
  userId: string,
  scope?: Scope,
  ttlMs = 30_000,
): Promise<string[]> {
  const key = `${userId}`;

  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.exp > now) return hit.perms;

  const params: any[] = [userId];

  const r = await pool.query(
    `
    SELECT DISTINCT p.key
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = $1
    `,
    params,
  );

  const perms = r.rows.map((x) => x.key as string);
  cache.set(key, { perms, exp: now + ttlMs });
  return perms;
}

export function requirePermission(perms: string[], required: string): boolean {
  // Support special admin wildcard if you seed it
  for (const g of perms) {
    if (matchPermission(g, required)) return true;
  }
  return false;
}
