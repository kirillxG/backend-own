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
- PostgreSQL

## Project Structure

- `src/server.ts` – server entrypoint
- `src/app.ts` – Fastify app setup
- `src/plugins/` – env, db, jwt, authz, envelope, error handling
- `src/routes/` – route modules
- `src/schemas/` – JSON Schemas
- `src/migrations/` – SQL migrations
- `src/cli/migrate.ts` – migration CLI

## Setup

### Install

```bash
npm install
```

### Environment

Create `.env` in project root:

```env
HOST=0.0.0.0
PORT=3000
NODE_ENV=development

DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/DBNAME

JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRES_IN=15m
```

### Database

Create the database referenced in `DATABASE_URL`.

Run migrations:

```bash
npm run migrate
```

### Run server

```bash
npm run dev
```

## Scripts

- `npm run dev` – development server
- `npm run build` – build TypeScript
- `npm run start` – run compiled server
- `npm run migrate` – apply migrations

## API Conventions

### Envelope

Success:
```json
{ "data": {} }
```

Error:
```json
{ "error": { "code": "...", "message": "..." } }
```

### Authentication

Send JWT as:

```
Authorization: Bearer <accessToken>
```

## Auth Routes

- `POST /v1/auth/register`
- `POST /v1/auth/login`

## RBAC

Tables:
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`

Grant admin (example):

```sql
INSERT INTO user_roles (user_id, role_id)
VALUES (1, 1)
ON CONFLICT DO NOTHING;
```

## Posts

Soft-delete enabled via `deleted_at`.

Routes:
- `POST /v1/posts`
- `GET /v1/posts`
- `GET /v1/posts/:id`
- `PATCH /v1/posts/:id`
- `DELETE /v1/posts/:id`

Only authors can update/delete their posts.

## Troubleshooting

- Missing `DATABASE_URL`: ensure dotenv is loaded in CLI
- JWT header errors: verify `Authorization: Bearer <token>`
- `authUser` TS errors: ensure Fastify module augmentation `.d.ts` is included in tsconfig

## License

Private / internal
