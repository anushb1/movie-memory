# Movie Memory

Sign in with Google, save your favorite movie, and get an AI-generated fun fact about it.

**Stack:** TypeScript · Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · Postgres · Prisma 6 · Auth.js (Google OAuth) · OpenAI API · Vitest

**Variant chosen: A (Backend: caching & correctness).** See [Why Variant A](#why-variant-a).

---

## Contents

1. [Setup](#setup)
2. [Environment variables](#environment-variables)
3. [Database & migrations](#database--migrations)
4. [Running tests](#running-tests)
5. [Architecture overview](#architecture-overview)
6. [Variant A: how fact caching works](#variant-a-how-fact-caching-works)
7. [Why Variant A](#why-variant-a)
8. [Key tradeoffs](#key-tradeoffs)
9. [With 2 more hours](#with-2-more-hours)
10. [AI usage](#ai-usage)

---

## Setup

**Requirements:** Node 20+, Postgres 14+ (tested on Postgres 16, Node 23).

```bash
# 1. Install dependencies
npm install

# 2. Create the databases (dev + a separate one for tests)
createdb movie_memory
createdb movie_memory_test

# 3. Configure environment
cp .env.example .env
#    then fill in the values (see the next section)

# 4. Create the tables
npx prisma migrate dev

# 5. Run
npm run dev
```

Open **http://localhost:3000** (use port 3000: it must match the Google redirect URI).

<details>
<summary>No Postgres installed? (macOS)</summary>

```bash
brew install postgresql@16
brew services start postgresql@16
```
</details>

### Google OAuth client

1. [Google Cloud Console](https://console.cloud.google.com/) → create a project.
2. **APIs & Services → OAuth consent screen**: External; add your Google account as a **test user**.
3. **Credentials → Create credentials → OAuth client ID → Web application**:
   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy the client ID and secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string, e.g. `postgresql://USER@localhost:5432/movie_memory` |
| `AUTH_SECRET` | ✅ | Signs/encrypts Auth.js cookies. Generate with `npx auth secret` or `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | ✅ | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | ✅ | Google OAuth client secret |
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `OPENAI_MODEL` | – | Defaults to `gpt-4o-mini` |
| `OPENAI_BASE_URL` | – | Point the OpenAI SDK at an OpenAI-compatible provider. Leave empty for OpenAI |
| `DATABASE_URL_TEST` | – | Test DB. Defaults to `postgresql://$USER@localhost:5432/movie_memory_test` |

None of these use the `NEXT_PUBLIC_` prefix, so none are ever sent to the browser.

---

## Database & migrations

```bash
npx prisma migrate dev      # apply migrations in development (creates the DB schema)
npx prisma migrate deploy   # apply existing migrations without prompting (CI / prod)
npx prisma studio           # browse/edit data in a local UI
```

Migrations live in `prisma/migrations/`. The test suite runs `prisma migrate deploy` against the **test** database automatically before running.

---

## Running tests

```bash
npm test
```

23 tests run against the separate `movie_memory_test` database with OpenAI mocked (no network calls, no cost):

| Area | What's covered |
|---|---|
| 60-second cache | Fresh at 59.999s, stale at exactly 60s; reuse under 60s; regenerate after; movie change = cache miss |
| Burst protection | 5 concurrent requests → **1** OpenAI call and **1** stored fact |
| Failure handling | Falls back to newest saved fact; friendly error when none; empty AI reply treated as failure |
| Authorization | A user never receives another user's fact (fresh, same movie, or as a fallback); `GET /api/fact` returns 401 / 409 / 503 correctly and exposes no ids |
| Validation | Trim + whitespace collapse, empty/whitespace-only rejected, length bounds measured after trimming |

To confirm the burst test is meaningful, I removed the advisory lock and re-ran it: it failed with *"expected 1 call, got 5"*.

---

## Architecture overview

```
Browser (React)
   │  server actions / fetch
   ▼
Next.js server (App Router)
   ├─ src/auth.ts ─────────────► Google OAuth (Auth.js + Prisma adapter)
   ├─ src/lib/session.ts        who is logged in + routing rule
   ├─ src/lib/validation.ts     one zod schema for movie input
   ├─ src/lib/facts.ts ────────► OpenAI (src/lib/openai.ts, server-only)
   └─ src/lib/prisma.ts ───────► Postgres
```

### Guiding rule
The browser is untrusted. Identity, validation and authorization are decided on the server. The user id **only** ever comes from the server-side session, never from a URL, body or query parameter.

### Request flow

1. **`/` (landing):** server component. Logged out → "Sign in with Google". Logged in → redirected by `homeFor(user)`.
2. **Sign in:** a server action calls `signIn("google")`. Google redirects back to `/api/auth/callback/google`; the Prisma adapter creates `User` + `Account` rows on first login and a `Session` row every login. The browser receives only an `httpOnly` session-token cookie.
3. **Routing rule (`homeFor`):** no session → `/`; no `favoriteMovie` → `/onboarding`; otherwise `/dashboard`. Keying on *"has a movie?"* rather than *"is a new account?"* means a user who abandoned onboarding is sent back to it. Every protected page re-checks this server-side.
4. **Onboarding:** server action → zod validation → `updateMany({ where: { id, favoriteMovie: null } })` so onboarding can set but never overwrite a movie → redirect to dashboard.
5. **Dashboard:** profile (with fallbacks for missing name/photo), movie with inline edit, fun fact, logout. The fact is an async server component inside `<Suspense>`, so the profile renders immediately and the fact streams in.
6. **Fact:** `getOrCreateFact(userId)` (see next section), also exposed as `GET /api/fact`.
7. **Edit movie:** server action with the same zod schema, then `revalidatePath("/dashboard")`.
8. **Logout:** `signOut()` deletes the `Session` row and clears the cookie.

### Data model

```
User ──< Fact
 │
 ├──< Account   (Auth.js)
 └──< Session   (Auth.js)
```

| Model | Notable fields | Why |
|---|---|---|
| `User` | `name?`, `email?`, `image?`, `favoriteMovie?` | Google may omit name/photo, so they're nullable. `favoriteMovie` lives on `User` (exactly one per user, so no join); `null` means onboarding isn't done |
| `Fact` | `userId`, `movie`, `content`, `createdAt` | `movie` is stored per fact so history stays correctly labeled after an edit, and so the cache key is `(userId, movie)` |
| `Fact` index | `@@index([userId, movie, createdAt desc])` | Exactly matches the hot query: "newest fact for this user + movie" |
| `Account`, `Session`, `VerificationToken` | standard Auth.js shape | Required by the Prisma adapter |

All relations use `onDelete: Cascade`, so deleting a user removes their facts and sessions.

### Sessions: database, not JWT
The session lives in Postgres; the cookie holds only a random token. Logging out deletes the row, so the session is revoked server-side immediately (a JWT stays valid until it expires). The cost is one DB lookup per request, which is negligible here.

### Security checklist

| Requirement | Implementation |
|---|---|
| Validate movie input server-side | Shared `movieSchema` (trim, collapse whitespace, 1–100 chars) in both server actions. The `maxLength` attribute is UX only |
| Users can't access/modify others' data | User id from session only; every query filtered by it; `GET /api/fact` accepts no user parameter; covered by tests |
| No secrets on the client | No `NEXT_PUBLIC_` vars; `import "server-only"` in `openai.ts` and `facts.ts` fails the build if imported client-side |
| Missing Google photo/name | Initial-letter avatar; name falls back to email, then "Movie fan" |
| Prompt injection via movie title | Title is sent as the user message; the system message instructs the model to treat it only as a title |

---

## Variant A: how fact caching works

`src/lib/facts.ts → getOrCreateFact(userId)`

```
newest fact for (user, movie) < 60s old? ──yes──► return it            [cache]
        │ no
🔒 pg_advisory_xact_lock(hash(user), hash(movie))
        │
check again: fresh now? ──yes──► return it                              [cache]
        │ no
call OpenAI ──ok──► insert fact ──► return it                           [generated]
        │ error / timeout / empty reply
newest saved fact for (user, movie), any age? ──yes──► return it        [fallback]
        │ no
FactUnavailableError → friendly message (HTTP 503 from /api/fact)
🔓 lock released automatically when the transaction ends
```

**1. 60-second window.** The `Fact` table *is* the cache: the newest row for `(userId, movie)` is the cached value and its `createdAt` is its age. `isFresh()` is a pure function (`now − createdAt < 60_000`) so the boundary is unit-tested without real waiting.

**2. Burst / idempotency protection: DB transaction guard.** Concurrent requests for the same `(user, movie)` (fast refreshes, several tabs, or several server instances) serialize on a Postgres **transaction-scoped advisory lock**. The first request generates; the others wait, then hit the **second cache check** inside the lock and return the fact the first one just stored (double-checked locking). Different users or movies hash to different locks, so they never block each other. The lock is released automatically on commit, rollback, or a dropped connection, so it can't be left stuck.

I chose this over an in-memory lock because an in-memory lock only protects a single Node process. With more than one instance (normal on Vercel or behind a load balancer) duplicates come back. Postgres is already shared by every instance.

**3. Failure handling.** The OpenAI client has a 10s timeout and 1 retry. On any failure (timeout, API error, empty reply) we return the newest saved fact for this user + movie regardless of age, labeled as a fallback; if there's none, a friendly error. The fallback query is scoped to the user, so an outage can't leak someone else's fact.

**4. Editing the movie needs no cache invalidation.** Because the cache key includes the movie, a new movie simply has no fresh fact and the next request generates one.

The dashboard shows which path served the fact ("Freshly generated", "Cached…", or "AI unavailable…").

---

## Why Variant A

- The base app's most interesting correctness problem is on the backend: an AI call that is slow, costs money, can fail, and can be triggered concurrently. Variant A asks for exactly that: caching, concurrency, and failure handling.
- It's testable end-to-end against a real database with a mocked model, so the guarantees (one call per burst, no cross-user access) are proven by tests rather than asserted.
- I wanted to go deep on one variant rather than shallow on both, per the brief.

I did add one small extra outside the variant: a simple **inline edit** of the favorite movie (server-validated with the same schema), because it makes the cache-key design visible and testing different movies easier. Variant B's optimistic UI, typed client, and client-side cache are intentionally out of scope.

---

## Key tradeoffs

| Decision | Upside | Cost / limitation |
|---|---|---|
| Advisory lock held during the OpenAI call | Simple, correct across multiple server instances, auto-releases | A DB connection is held for up to ~20s (10s timeout + 1 retry) per generating request; under heavy concurrent generation this could exhaust the connection pool |
| `Fact` table as the cache (no Redis) | No extra infrastructure; the spec already requires storing facts | Every cache hit is a DB query (indexed, cheap at this scale) |
| Rolling 60s window via `createdAt` | Exact "less than 60 seconds" semantics | Relies on app and DB clocks agreeing (same machine here; in prod both are NTP-synced) |
| Per-user facts | Clean authorization; matches the spec | Two users with the same movie each pay for a generation |
| Database sessions | Instant server-side revocation on logout | One DB lookup per authenticated request |
| Redirects in server components, not middleware | Can read `favoriteMovie` from the DB (Prisma doesn't run in the Edge runtime) | Each protected page must call the check (centralized in `getCurrentUser` / `homeFor`) |
| Fact rendered in a server component | No client fetch code; fact streams via `<Suspense>` | Getting a "new" fact means a page refresh (fine given the 60s window) |

---

## With 2 more hours

1. **Release the DB connection during generation.** Insert a `generating` placeholder row guarded by a unique `(userId, movie)` partial index, call OpenAI outside the transaction, then fill it in. This keeps the burst guarantee without holding a connection open.
2. **Shared per-movie fact pool.** A `MovieFact` table keyed by normalized title, plus per-user "seen" tracking, to cut OpenAI cost for popular movies without exposing user data.
3. **Rate limiting** per user on fact generation (beyond the 60s window) to cap spend from scripted abuse.
4. **End-to-end test** of the auth → onboarding → dashboard flow with Playwright, using a seeded session.
5. **Structured logging + metrics** for cache hit rate, generation latency, and fallback frequency.
6. **Explicit "new fact" button** that bypasses the client's refresh, plus showing the fact's age.
7. **CI** (GitHub Actions with a Postgres service) running lint, typecheck, and tests on every push.

---

## AI usage

- **Understanding the brief:** used ChatGPT to get an initial breakdown of the PDF, then used Claude to check that breakdown against the actual PDF. This caught missed requirements (e.g. redirecting logged-out users from `/dashboard`, the "unless user explicitly requests" detail, the exact test requirements) and weak design choices.
- **Design discussion:** talked through schema design, the onboarding routing rule ("has a movie?" vs "new account?"), session strategy, and the burst-protection options with Claude before writing code.
- **Implementation:** used Claude Code to scaffold the project and write the code stage by stage (auth → onboarding → dashboard → facts → Variant A → tests), reviewing and asking for an explanation of each file before moving on.
- **Debugging:** used Claude to diagnose a Google `redirect_uri_mismatch` (a second dev server on port 3001), a stale Next.js dev cache, and hydration warnings caused by a browser extension.
- **Testing:** AI wrote the initial test suite; I verified the burst test actually detects the bug by removing the lock and confirming it fails.
- **Verification:** every stage was checked by running the app, the typechecker, the linter, and the tests. I can explain every file and decision in this repository.
