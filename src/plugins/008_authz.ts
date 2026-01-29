import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { getUserPermissions, requirePermission } from "../authz/permissions";

type GuardOpts = {
  permission: string;
  // Optional ABAC: check ownership etc.
  // Return true to allow, false to deny.
  condition?: (ctx: { userId: string; req: any }) => Promise<boolean> | boolean;
  scope?: (req: any) => { scopeType?: string; scopeId?: string } | undefined;
};

declare module "fastify" {
  interface FastifyInstance {
    guard: (opts: GuardOpts) => (req: any, reply: any) => Promise<void>;
  }
}

const plugin: FastifyPluginAsync = async (app) => {
  app.decorate("guard", (opts: GuardOpts) => {
    return async (req: any) => {
      // must authenticate first
      if (!req.authUser?.id) throw app.httpErrors.unauthorized("Unauthorized"); //#endregion

      const scope = opts.scope ? opts.scope(req) : undefined;
      const perms = await getUserPermissions(app.pg, req.authUser.id, scope);

      const okPerm = requirePermission(perms, opts.permission);
      if (!okPerm) throw app.httpErrors.forbidden("Forbidden");

      if (opts.condition) {
        const okCond = await opts.condition({ userId: req.authUser.id, req });
        if (!okCond) throw app.httpErrors.forbidden("Forbidden");
      }
    };
  });
};

export default fp(plugin);
