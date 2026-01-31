# Backend API – Production README

## Purpose

This repository contains the production backend API for the application. It exposes a RESTful HTTP interface intended for consumption by trusted clients.

This document is the **source of truth** for setup, usage, and integration. If behavior diverges from this README, the code is wrong.

---

## Tech Stack

- Runtime: Node.js
- Framework: Express-style HTTP server
- Auth: JWT
- Transport: JSON over HTTP

---

## Dependencies

Primary runtime dependencies:

- @fastify/autoload
- @fastify/cookie
- @fastify/cors
- @fastify/env
- @fastify/jwt
- @fastify/sensible
- @fastify/swagger
- @fastify/swagger-ui
- argon2
- dotenv
- fastify
- pg

---

## Environment Configuration

The following environment variables are required at runtime:

- DATABASE_URL
- NODE_ENV

Failure to provide these will cause startup or runtime failure. No defaults are assumed in production.

---

## Middleware

Global middleware enforced by the server:

- CORS
- JWT authentication

---

## Authentication

Authentication is handled using JWTs.

Clients must include:

```
Authorization: Bearer <JWT>
```

Tokens are assumed to be signed by the backend and validated on every protected route. Expired or invalid tokens result in `401 Unauthorized`.

---

## API Routes

All routes consume and return JSON unless explicitly stated otherwise.

---

## Error Handling

The API uses standard HTTP status codes:

- 400: Invalid request / validation failure
- 401: Authentication failure
- 403: Authorization failure
- 404: Unknown route
- 500: Unhandled server error

Clients should not rely on error message strings; only status codes are stable.

---

## Running Locally

1. Install dependencies

```
npm install
```

2. Provide environment variables (see above)

3. Start server

```
npm run start
```

---

## Deployment Expectations

- This service is stateless
- Horizontal scaling is supported
- Secrets must be injected via environment variables
- Do not expose directly to the public internet without a gateway

---

## Contract Discipline

If you add or change:

- a route
- a request/response shape
- an auth rule

You **must** update this README in the same change. No exceptions.
