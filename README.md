# Fastify + TypeScript Backend

Backend service built with Fastify + TypeScript, PostgreSQL (`pg`), SQL migrations, JWT auth, RBAC, and a consistent API response envelope.

## Overview

Core features:

- Fastify server with TypeScript
- PostgreSQL connection via `pg` pool
- SQL migrations in `src/migrations` applied via CLI command
- Authentication: register + login (password hashing) + JWT access tokens
- Authorization: RBAC (roles, permissions, role-permission mapping, user-role assignment)
- API response contract:
  - Success: `{ "data": <payload> }`
  - Error: `{ "error": { "code": "...", "message": "...", "details"?: ..., "requestId"?: "..." } }`
- Posts CRUD with soft-delete (`deleted_at`) and ownership enforcement for update/delete

## Requirements

- Node.js (LTS recommended)
- PostgreSQL (local or remote)

## Project Structure (high level)

- `src/server.ts` - entrypoint (listen)
- `src/app.ts` - Fastify instance (plugins + routes)
- `src/plugins/` - env, swagger, pg, jwt, envelope, error handler, authz
- `src/routes/` - route modules (`auth`, `admin-rbac`, `posts`, etc.)
- `src/schemas/` - JSON Schemas (request/response)
- `src/migrations/` - SQL migration files
- `src/cli/migrate.ts` - migration runner CLI

## Setup

### 1) Install dependencies

```bash
npm install
2) Create .env
Create a .env file in the project root:

# Server
HOST=0.0.0.0
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/DBNAME

# Auth
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars
JWT_EXPIRES_IN=15m
Notes:

If your password contains special characters (@, :, /, #, etc.) you must URL-encode it in DATABASE_URL.

JWT_SECRET must be long and random.

3) Create the database
Create the database referenced by DATABASE_URL (using your preferred method: psql, pgAdmin, Docker, etc.).

4) Run migrations
npm run migrate
5) Start development server
npm run dev
Server will listen on http://HOST:PORT.

Scripts
npm run dev — start dev server

npm run build — compile TypeScript and copy migrations to dist/

npm run start — run compiled server

npm run migrate — run migrations against DATABASE_URL (builds first)

API Conventions
Response Envelope
All successful responses are wrapped:

{ "data": { ... } }
All errors are wrapped:

{
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable",
    "details": {},
    "requestId": "req-123"
  }
}
Authentication
Login returns an accessToken.

Send it on requests as a Bearer token:

Authorization: Bearer <accessToken>

Example fetch:

const res = await fetch("http://localhost:3000/v1/posts", {
  headers: { Authorization: `Bearer ${accessToken}` }
});
const json = await res.json();
Auth Routes
Prefix is /v1 if your route autoload uses that prefix.

Register
POST /v1/auth/register

Body:

{
  "email": "user@example.com",
  "password": "a-strong-password",
  "displayName": "User"
}
Login
POST /v1/auth/login

Body:

{
  "email": "user@example.com",
  "password": "a-strong-password"
}
Response:

{
  "data": {
    "accessToken": "....",
    "user": { "id": "1", "email": "user@example.com", "displayName": "User" }
  }
}
RBAC (Roles & Permissions)
RBAC tables:

roles

permissions

role_permissions

user_roles

Grant yourself admin (SQL)
Find your user id:

SELECT id, email FROM users WHERE email = 'you@example.com';
Find admin role id:

SELECT id, name FROM roles WHERE name = 'admin';
Assign admin:

INSERT INTO user_roles (user_id, role_id)
VALUES (<YOUR_USER_ID>, <ADMIN_ROLE_ID>)
ON CONFLICT DO NOTHING;
Then login again to get a token reflecting your permissions (and/or restart if you cache permissions).

Admin RBAC Routes
These routes are protected via JWT + RBAC permissions.

Examples:

GET /v1/admin/rbac/roles — list roles (optionally includes permissions per role if implemented)

POST /v1/admin/rbac/roles — create role

GET /v1/admin/rbac/permissions — list permissions

PUT /v1/admin/rbac/roles/:roleId/permissions — set role permission list

GET /v1/admin/users/:userId/roles — list user roles

PUT /v1/admin/users/:userId/roles — set user roles

Posts (CRUD + Soft Delete)
Posts table uses soft delete:

A delete sets deleted_at = now()

Reads exclude deleted posts by default

Routes:

POST /v1/posts — create post (auth required)

GET /v1/posts — list posts (auth required)

GET /v1/posts/:id — get post (auth required)

PATCH /v1/posts/:id — update post (auth required; only author can update)

DELETE /v1/posts/:id — soft delete (auth required; only author can delete)

Swagger / Docs
If swagger is enabled:

GET /docs — Swagger UI

Troubleshooting
“Missing env: DATABASE_URL” when running migrations
The migration CLI reads process.env. Ensure .env is loaded in src/cli/migrate.ts:

import "dotenv/config";
JWT error: “No Authorization was found in request.headers”
You are not sending the header correctly.

Correct:

Header key: Authorization

Value: Bearer <token>

No backticks, no quotes, no extra characters.

TypeScript: Property 'authUser' does not exist on type 'FastifyRequest'
Your Fastify module augmentation .d.ts is not included in the build. Ensure:

The file exists under src/ (e.g. src/types/fastify.d.ts)

tsconfig.json includes src/**/*.d.ts

You are building with the intended tsconfig (check package.json build script)

License
Private / internal (update as needed).

::contentReference[oaicite:0]{index=0}
```
