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
- [X] Dependencies installed successfully

## Phase 2: Database Schemas (inline in `src/index.ts`)
- [ ] MongoDB Atlas connection via native `mongodb` driver
- [ ] Define `product` collection indexes (title text, tags, category, price, rating)
- [ ] Define `user` collection helpers (shared with Better Auth)

## Phase 3: Middleware (inline in `src/index.ts`)
- [ ] CORS — `origin: FRONTEND_URL`, credentials: true
- [ ] `express.json()`
- [ ] `verifyToken` — reads `Bearer <token>`, queries `session` collection, attaches `req.user`
- [ ] `requireRole` closure — checks role, returns 403
- [ ] Rate limiter — global + stricter on AI routes
- [ ] Global error handler at bottom

## Phase 4: Product Routes (`GET/POST/DELETE /api/items/*`)
- [ ] `GET /api/items` — public catalog, filters, sort, cursor pagination
- [ ] `GET /api/items/:id` — public, single product
- [ ] `POST /api/items` — protected (vendor+), create
- [ ] `DELETE /api/items/:id` — protected, verify ownership

## Phase 5: AI Routes (`POST /api/ai/*`)
- [ ] `POST /api/ai/generate` — protected, LLM copy generation
- [ ] `POST /api/ai/recommend` — protected, LLM recommendations

## Phase 6: Validation & Hardening
- [ ] Input validation on all POST bodies
- [ ] No `$where`/`$regex` injection in query params
- [ ] `trust proxy` for rate limiting

## Phase 7: Health & Logging
- [ ] `GET /api/health` endpoint
- [ ] Request logging (morgan or custom)

## Phase 8: Deployment
- [ ] Production build script
- [ ] Final CORS/rate-limit tuning
- [ ] Deploy to Railway / Render / Fly.io
