# Product Requirement Document (PRD) - Inventra Backend
## Category: Full-Stack AI Product Catalog & E-Commerce Application (Flat Architecture)
## Version: 1.1.0

---

### 1. Architectural Blueprint & Flat Server Architecture
This document sets the operational framework for the **Inventra Backend API Engine**. Deviating from complex structural pattern systems, this backend strictly follows a monolithic **Flat Script Architecture**. Every application endpoint, pipeline middleware, database scheme definition, and agent orchestrator is compiled inside a singular, high-performance root processing file (`src/index.ts`).

#### Technology Stack Core
*   **Runtime Environment:** Node.js (Long-Term Support version).
*   **Framework Layer:** Express.js implemented using strict TypeScript compile configurations.
*   **Database Management:** MongoDB Atlas (M1 cluster tier or higher) executing inline object mapping via Mongoose inside the main entry point.
*   **Security & Identity Core:** Inline validation middleware combining JSON Web Tokens (JWT) for custom cross-origin state verifications and Better Auth hooks for the primary OAuth tracking logic.
*   **AI Integration Orchestration:** Inline API wrappers for OpenAI, Gemini, and Claude LLM runtimes using specialized systemic prompt scripts inside specific route handling functions.

#### File & Directory Schema
```text
backend/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts        # MANDATORY SINGLE FILE: Contains all schemas, routes, middleware, and AI connections
```

---

### 2. Inline Core Operational Database Models (Mongoose Schemas)
All schemas are declared directly within `src/index.ts` prior to instantiation of Express routing maps.

#### 2.1 User Model Schema (`User`)
*   `email`: String (Unique, Indexed, Lowcase trim validation).
*   `passwordHash`: String (Selected false by default for security).
*   `fullName`: String (Required).
*   `provider`: String (Enum: `'local'`, `'google'`).
*   `role`: String (Enum: `'user'`, `'vendor'`, `'admin'`, default: `'user'`).
*   `interactionLog`: Array of Objects tracking past search context logs.

#### 2.2 Product Asset Model Schema (`Product`)
*   `title`: String (Required, text index optimized).
*   `shortDescription`: String (Max length enforced).
*   `fullDescription`: String (Markdown text profile).
*   `price`: Number (Indexed, required floor limit validations).
*   `category`: String (Validated collection context category).
*   `tags`: Array of Strings (Indexed for fast inline aggregate array lookups).
*   `rating`: Number (Default 0, computed aggregate average).
*   `vendorId`: mongoose.Schema.Types.ObjectId (References `User`).
*   `telemetry`: Object mapping system latency, tool execution safety rates, and token volume history.

---

### 3. Inline Security & Protected Access Execution Middleware
Declared directly within the `index.ts` file block sequence:

#### 3.1 Authentication Subsystem
*   **Better Auth Syncing:** Validates incoming cross-origin session keys, mapping structural payload tracking context back to the inline User instance tracking arrays.
*   **JWT Security Engine:** Decodes and signs unique tokens inline for cross-origin tracking safety across separate web runtime layers.

#### 3.2 Authorization Blocks
*   `authenticateUser` function: Validates user tokens inside the root request middleware stack, appending extracted details to `req.user`. Drops bad calls with an absolute `401 Unauthorized` JSON format response.
*   `requireRole` helper closure: Verifies authorization permissions instantly, dropping non-privileged entries with a strict `403 Forbidden` response header block.

---

### 4. Consolidated RESTful Route Endpoints (Main Route Loop)
All controllers are written as inline callback handlers directly inside the Express router framework (`app.post`, `app.get`, etc.) in `src/index.ts`.

#### 4.1 Authentication Endpoint Maps (`/api/v1/auth`)
*   `POST /register` - Form data checks, high-entropy hashing processing, profile registration block execution.
*   `POST /login` - Password match validation, session generation, credential payload responses.
*   `POST /social-callback` - Links modern identity tracking hooks directly to active database structures.

#### 4.2 Product Asset Management & Discovery Maps (`/api/v1/items`)
*   `GET /` - Public catalog interface route. Runs complex inline `.find()` queries using compound query flags (`category`, `priceRange`, `minRating`, text matching) and inline parameter parsing for sorting blocks (`latency`, `downloads`).
*   `GET /:id` - Fetches single items while updating user interaction matrix structures.
*   `POST /` - Protected line call routing. Validates vendor profiles then builds a new asset document via `.create()`.
*   `DELETE /:id` - Protected line call routing. Verifies entry asset authorization prior to executing complete removal actions.

---

### 5. Consolidated Agentic AI Services
Integrated directly into route loops within `src/index.ts`.

#### 5.1 Asset Metadata Copy Generation Pipe (`POST /api/v1/ai/generate`)
*   Takes application variables directly from user inputs. Run calls inline using official SDK modules passing target prompt text sequences. Enforces exact structural criteria using zero-temperature parameters to yield perfect product text blocks directly back to client callers.

#### 5.2 Context-Aware Recommendation Engine (`POST /api/v1/ai/recommend`)
*   Reads active filtering contexts directly inside the incoming request block payload. Feeds database model outputs into clean string templates directly to the target LLM module, instructing it to return an array of primary MongoDB reference keys matching the catalog items.

---

### 6. Production Safety, Error Mitigation & CORS Systems
*   **CORS Configuration:** Applied via global inline config (`app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))`).
*   **Global Exception Handling:** Single fallback error listener block placed at the absolute base of `src/index.ts` (`app.use((err, req, res, next) => { ... })`) ensuring all formatting failures, validation breaks, or LLM issues return structured tracking telemetry.
*   **Rate Limiting:** Global rate limit filters applied directly to auth and AI endpoints to protect single-file server stability.
