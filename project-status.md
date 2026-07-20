# Inventra Backend — Project Status

## Current Phase: Phase 1 — Project Setup
**Status:** Completed ✅

---

### Milestones

| Milestone | Status | Target |
|-----------|--------|--------|
| Project setup & dependencies | ✅ Complete | Phase 1 |
| Database schemas | Pending | Phase 2 |
| Middleware (CORS, auth, rate-limit, errors) | Pending | Phase 3 |
| Product CRUD routes | Pending | Phase 4 |
| AI generation & recommendation routes | Pending | Phase 5 |
| Security & validation hardening | Pending | Phase 6 |
| Health & logging | Pending | Phase 7 |
| Production readiness & deployment | Pending | Phase 8 |

---

### Key Decisions
- **Architecture:** Flat single-file (`src/index.ts`) — all schemas, routes, middleware inline
- **Runtime:** Node.js LTS + Express.js
- **Database:** MongoDB Atlas (native `mongodb` driver, no Mongoose)
- **Auth:** Better Auth on frontend; `verifyToken` middleware queries `session` collection
- **AI:** OpenAI, Gemini, Claude SDKs with zero-temperature prompts
- **Versionless routes:** No `/api/v1/`, just `/api/items`, `/api/ai`, `/api/health`
- **Deployment:** Separate origin from frontend, CORS configured via `FRONTEND_URL` env
