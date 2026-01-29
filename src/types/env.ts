export type Env = {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  HOST: string;

  DATABASE_URL: string;

  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  COOKIE_SECRET: string;
  COOKIE_NAME: string;

  FRONTEND_ORIGIN: string;
};
