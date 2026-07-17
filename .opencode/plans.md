# Inventra Backend — Implementation Plan

## Legend
- `[ ]` Pending
- `[~]` In Progress
- `[X]` Completed

---

## Phase 1: Project Setup

- [ ] Initialize Node.js project with `package.json`, `tsconfig.json` (strict mode)
- [ ] Install dependencies: express, mongoose, jsonwebtoken, cors, bcrypt, dotenv, express-rate-limit
- [ ] Install AI SDKs: openai, @google/generative-ai, @anthropic-ai/sdk
- [ ] Install dev deps: typescript, ts-node-dev, @types/*
- [ ] Create `src/index.ts` — the single flat entry point
- [ ] Set up environment variables: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, AI API keys

## Phase 2: Database Schemas (inline in `src/index.ts`)

- [ ] Define `User` schema: email (unique, indexed), passwordHash (select: false), fullName, provider, role (enum), interactionLog
- [ ] Define `Product` schema: title, shortDescription, fullDescription, price, category, tags, rating, vendorId (ref User), telemetry

## Phase 3: Middleware (inline in `src/index.ts`)

- [ ] Implement CORS middleware — `origin: process.env.FRONTEND_URL`, credentials: true
- [ ] Implement JSON body parser, URL-encoded parser
- [ ] Implement rate limiter (global + stricter on auth/AI routes)
- [ ] Implement `authenticateUser` middleware (JWT verification, attaches to `req.user`)
- [ ] Implement `requireRole` middleware closure (checks role, returns 403)
- [ ] Implement global error handler at bottom of file

## Phase 4: Auth Routes (`POST /api/v1/auth/*`)

- [ ] `POST /register` — validate input, hash password, create user, return JWT
- [ ] `POST /login` — find user by email, compare password, return JWT
- [ ] `POST /social-callback` — handle Google OAuth / Better Auth callback
- [ ] Integrate Better Auth SDK for OAuth session syncing

## Phase 5: Product Routes (`GET/POST/DELETE /api/v1/items/*`)

- [ ] `GET /` — compound query with filters: category, priceRange, minRating, text search; sort by latency, downloads; paginate results
- [ ] `GET /:id` — fetch single product + update user interactionLog
- [ ] `POST /` — protected (vendor+), create product document
- [ ] `DELETE /:id` — protected (vendor/admin), verify ownership, delete product

## Phase 6: AI Routes (`POST /api/v1/ai/*`)

- [ ] `POST /generate` — accept app variables, call LLM (OpenAI/Gemini/Claude) with zero-temperature prompt, return generated copy
- [ ] `POST /recommend` — read active filter context, query DB, feed to LLM, return array of product IDs

## Phase 7: Security & Validation

- [ ] Input sanitization and schema validation on all POST/PUT endpoints
- [ ] Password hashing with bcrypt (salt rounds 12)
- [ ] JWT expiry configuration (access token)
- [ ] Environment-based key management (never hardcode secrets)

## Phase 8: Production Readiness

- [ ] Add health check endpoint (`GET /api/v1/health`)
- [ ] Add request logging middleware (morgan or custom)
- [ ] Finalize CORS whitelist and rate limit tuning
- [ ] Test all endpoints with a REST client
- [ ] Deploy to Railway / Render / Fly.io (separate origin from frontend)
