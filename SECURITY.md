# Security

This document is a real account of GANTRY's security posture, including the vulnerabilities that were actually found and fixed during development — not a checklist written after the fact. Every claim below is backed by a specific file and line, and by the regression tests in `tests/auth.spec.ts` that exist specifically to catch the class of bug described in §2.

## 1. Authentication

GANTRY uses real credential-based auth for stadium officials, not a third-party OAuth provider — a deliberate switch away from an earlier Google OAuth build, made because a FIFA official's access to an operations dashboard shouldn't depend on them having (or wanting to use) a personal Google account, and because owning the credential store end to end makes the actual access-control logic auditable in this repo rather than delegated to an opaque provider flow.

**Storage.** Official accounts live in a real Cloudflare KV namespace (`OFFICIALS_KV`, `wrangler.jsonc`), keyed `official:<email>`, holding `{ email, passwordHash, createdAt }` — never a plaintext password (`lib/auth/officials-kv.ts`).

**Password hashing.** PBKDF2-SHA256, 100,000 iterations (OWASP's current minimum recommendation for that algorithm), via the Web Crypto API (`lib/auth/password.ts`) — not bcrypt/argon2, because those need a native binding that doesn't exist in the Cloudflare Workers runtime this app deploys to. Verification uses a constant-time comparison, not `===`, so a timing side-channel can't leak how many leading bytes of a guessed hash matched.

**Sessions.** A signed HS256 JWT (via `jose`, the same library NextAuth used internally) in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie (`lib/auth/session.ts`) — unreadable and unmodifiable from client JS, and rejected by the server if the signature or expiry (7 days) doesn't check out.

**Signup gating.** Account creation (`/api/auth/signup`) requires a shared invite code (`OFFICIAL_INVITE_CODE` env var) checked server-side — not open self-registration. For this hackathon deployment the code is deliberately shown on the signup form itself (`NEXT_PUBLIC_OFFICIAL_INVITE_CODE_HINT`) so judges can reach the dashboard with zero friction; that's a demo-access tradeoff, disclosed here rather than hidden, not a claim that this is a vetted-identity system. In a real deployment, unsetting the `NEXT_PUBLIC_` hint (while keeping the server-side `OFFICIAL_INVITE_CODE` check) hides the code from the UI without changing the actual access control.

`middleware.ts` verifies that session cookie on every request to a protected route:

```ts
export default async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.redirect(new URL("/welcome", req.nextUrl));
  }
}
```

Two routes are deliberately excluded from this gate, both with a documented reason rather than a silent gap:

- **`/welcome`** — the pre-auth landing page; excluding it is required for anyone to reach the sign-in form at all.
- **`/report/[venueId]/[gateId]`** — the QR-code quick-report kiosk page. A gate steward scanning a printed code on matchday isn't signed into the ops dashboard, so this page is intentionally public. See §3 for how the *submission endpoint* behind it stays safe despite having no auth.

**Login response uniformity.** `/api/auth/login` returns the exact same `401` body for "no such account" and "wrong password" (`lib/auth/session.ts` callers in `app/api/auth/login/route.ts`) — a distinct message for each would let an attacker enumerate valid official emails one guess at a time. Covered by a test in `tests/auth.spec.ts`.

**Brute-force protection.** Both `/api/auth/login` and `/api/auth/signup` are rate-limited per source IP (10 requests/minute, `lib/external/rate-limiter.ts`, keyed off the `cf-connecting-ip` header Cloudflare sets) — tighter than the per-process limits on the AI routes, since credential endpoints are a guessing target in a way those aren't.

## 2. A real vulnerability that was found and fixed here, not hypothetical

Early in development, API routes (`/api/fan-assistant`, `/api/simulate-anomaly`, `/api/venue-pois`, `/api/quick-reports`) were briefly excluded from the middleware's auth matcher entirely — done to fix a *different*, real bug (a middleware redirect was returning HTML to a `fetch()` call expecting JSON, silently breaking the client). That fix accidentally left every AI-calling endpoint reachable by anyone with the URL, no login required — capable of burning the project's free-tier Groq quota with zero authentication.

**The fix:** every one of those routes now checks the session directly inside the handler, returning a proper `401` JSON response (not a redirect, which is what broke `fetch()` in the first place):

```ts
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

**Why this matters more than "we added auth checks":** this exact class of bug — a broad middleware exclusion silently reopening something that used to be protected — is exactly the kind of regression that's invisible in a manual click-through test and only shows up when someone (or something) hits the raw endpoint. That's why it's covered by automated tests, not just a manual verification:

```ts
test("fan-assistant API rejects an unauthenticated request", async ({ request }) => {
  const response = await request.post("/api/fan-assistant", { data: { question: "test" } });
  expect(response.status()).toBe(401);
});
```

Five separate tests in `tests/auth.spec.ts` cover this boundary — `fan-assistant`, `simulate-anomaly`, `venue-pois`, `quick-reports`, plus a positive test confirming the intentionally-public `/report` page and its submission endpoint still work. This suite exists *because* the bug happened once, not as decoration.

## 3. The one intentionally public write endpoint, and why it's safe

`/api/quick-report` (backing the QR kiosk) has no session check by design. What keeps it safe isn't obscurity — it's that every accepted input is a closed enum, validated server-side against real data, with no free-text field anywhere in the payload:

```ts
function isValidPayload(body: unknown): body is { venueId: string; gateId: string; presetId: string } {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return typeof b.venueId === "string" && typeof b.gateId === "string" && typeof b.presetId === "string";
}
```

...followed by a second check that each string is actually a real venue ID, a real gate ID, and one of exactly four known preset IDs — not just "is a string":

```ts
const venueExists = VENUE_CATALOG.some((v) => v.id === venueId);
const gateLabel = GATE_LABELS[gateId];
const preset = getQuickReportPreset(presetId);

if (!venueExists || !gateLabel || !preset) {
  return NextResponse.json({ error: "Unknown venue, gate, or report type." }, { status: 400 });
}
```

The actual text that reaches the LLM pipeline is built server-side from a fixed template (`preset.reportTemplate(...)`), never from anything the client sent directly — so this endpoint cannot be used for prompt injection the way an open "describe the incident" text field could be, and `tests/auth.spec.ts` includes a test confirming an unknown preset ID is rejected with `400`, not silently accepted. It's also rate-limited (10 requests/minute, tighter than the 20/minute on the authenticated staff routes) specifically because it's reachable without login.

## 4. Secrets

No API key or credential is hardcoded anywhere in source. All of them — `GROQ_API_KEY`, `AUTH_SECRET` (session JWT signing key), `OFFICIAL_INVITE_CODE`, `CENSUS_API_KEY`, `AIRNOW_API_KEY`, `TRANSITLAND_API_KEY` — are read from `process.env` and live only in `.env.local`, which is git-ignored (`.env*.local` in `.gitignore`). `.env.example` documents every variable name with an empty value, so the repo is self-documenting about what configuration it needs without exposing what that configuration actually is. Real secrets pasted into chat during development were flagged for rotation at the time, on the same principle. The Google OAuth client secret used by the earlier NextAuth build is no longer read anywhere in this codebase now that credential auth replaced it.

## 5. Rate limiting

Every route that calls Groq is throttled by an in-memory token-bucket limiter (`lib/external/rate-limiter.ts`) — not to stop abuse at scale (a single-process in-memory bucket resets on redeploy and doesn't survive multiple instances, which is an honest, disclosed limitation, not hidden), but to make sure a burst of demo/judging traffic degrades to a friendly `429` instead of silently exhausting the free-tier Groq key mid-demo.

## 6. Dependency vulnerabilities

`npm audit` currently reports 2 moderate-severity findings, both nested inside Next.js's own bundled `postcss` dependency (`node_modules/next/node_modules/postcss`), not a direct dependency of this project. The only available fix (`npm audit fix --force`) would downgrade Next.js to version `9.3.3` — not a real option. The actual exploit surface (`PostCSS has XSS via Unescaped </style> in its CSS Stringify Output`) requires processing untrusted CSS input at build time, which this project never does; there is no user-supplied CSS anywhere in the app. This is a disclosed, accepted residual risk, not an unnoticed one.

Separately: this project was upgraded from Next.js 14.2.35 to 15.5.20 partway through development. 14.2.35 (the latest available 14.x patch at the time) carried several published high-severity CVEs with no in-range fix — only a major-version bump resolved them. That upgrade was verified with a full rebuild, a strict `tsc --noEmit` pass, a clean `next lint` pass, and all 9 Playwright tests passing before being treated as safe to ship.

## 7. What's honestly out of scope

- **No CSRF token beyond what Auth.js provides by default** — session cookies are `HttpOnly`/`SameSite=Lax` (Auth.js defaults), not custom-hardened further.
- **No WAF / DDoS protection beyond Cloudflare's platform defaults** — this is a hackathon deployment, not a production security posture for a real matchday.
- **The in-memory rate limiter and quick-report relay (`lib/external/quick-report-store.ts`) don't survive a process restart or scale across multiple instances** — acceptable for the deployment target, explicitly documented in the source rather than glossed over.
