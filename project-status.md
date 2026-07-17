# Inventra Backend — Project Status

## Current Phase: Setup & Planning
**Status:** Not started

---

### Milestones

| Milestone | Status | Target |
|-----------|--------|--------|
| Project setup & dependencies | Pending | Phase 1 |
| Database schemas (Mongoose inline) | Pending | Phase 2 |
| Middleware (CORS, auth, rate-limit, errors) | Pending | Phase 3 |
| Auth routes (register, login, social) | Pending | Phase 4 |
| Product CRUD routes | Pending | Phase 5 |
| AI generation & recommendation routes | Pending | Phase 6 |
| Security & validation hardening | Pending | Phase 7 |
| Production readiness & deployment | Pending | Phase 8 |

---

### Key Decisions
- **Architecture:** Flat single-file (`src/index.ts`) — all schemas, routes, middleware inline
- **Runtime:** Node.js LTS + Express.js
- **Database:** MongoDB Atlas (M1 cluster) + Mongoose
- **Auth:** JWT + Better Auth (Google OAuth)
- **AI:** OpenAI, Gemini, Claude SDKs with zero-temperature prompts
- **Deployment:** Separate origin from frontend, CORS configured via `FRONTEND_URL` env
