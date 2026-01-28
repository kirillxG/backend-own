export type Env = {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  HOST: string;

  DATABASE_URL: string;

  JWT_SECRET: string;
};
