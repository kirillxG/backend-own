import "fastify";
import type { Env } from "./env";

declare module "fastify" {
  interface FastifyInstance {
    config: Env;
    pg: Pool;
    auth: (req: any) => Promise<void>;
  }
}
