# Inventra Backend — Implementation Plan

## Legend
- `[ ]` Pending
- `[~]` In Progress
- `[X]` Completed

---

## Phase 1: Project Setup
- [X] Init `package.json` with ESM + `tsconfig.json` strict mode
- [X] Install deps: express, mongodb, cors, dotenv, express-rate-limit
- [X] Install AI SDKs: openai, @google/generative-ai, @anthropic-ai/sdk
- [X] Install dev deps: typescript, tsx, @types/express, @types/cors
- [X] Create `.env` with PORT, MONGODB_URI, FRONTEND_URL, AI API keys
- [X] Create `src/index.ts` — the single flat entry point + `npm run dev` script

## Phase 2: Database Schemas (inline in `src/index.ts`)
- [X] MongoDB Atlas connection via native `mongodb` driver
- [X] Define `product` collection indexes (title text, tags, category, price, rating)
- [X] Define `user` collection helpers (shared with Better Auth)

## Phase 3: Middleware (inline in `src/index.ts`)
- [X] CORS — `origin: FRONTEND_URL`, credentials: true
- [X] `express.json()` — with 1mb limit
- [X] `verifyToken` — reads `Bearer <token>`, queries `session` collection, attaches `req.user`
- [X] `requireRole` closure — checks role, returns 403
- [X] Rate limiter — global (100/min) + stricter AI limiter (20/min)
- [X] Global error handler at bottom + 404 handler

## Phase 4: Product Routes (`GET/POST/DELETE /api/items/*`)
- [X] `GET /api/items` — public catalog, filters, sort, cursor pagination
- [X] `GET /api/items/:id` — public, single product
- [X] `POST /api/items` — protected (vendor+), create product
- [X] `DELETE /api/items/:id` — protected, verify ownership

## Phase 5: AI Routes (`POST /api/ai/*`)
- [X] `POST /api/ai/generate` — protected, LLM copy gen (OpenAI/Gemini/Claude)
- [X] `POST /api/ai/recommend` — protected, LLM recommendations

## Phase 6: Validation & Hardening
- [X] Input validation on POST /api/items (title length, price > 0, tags type check)
- [X] `sanitize()` helper strips `$` operators from queries/bodies (NoSQL injection)
- [X] `trust proxy` for rate limiting behind reverse proxy

## Phase 7: Health & Logging
- [X] `GET /api/health` endpoint
- [X] Request logging (timestamp + method + url)

## Phase 8: Deployment
- [ ] Production build script
- [ ] Final CORS/rate-limit tuning
- [ ] Deploy to Railway / Render / Fly.io
