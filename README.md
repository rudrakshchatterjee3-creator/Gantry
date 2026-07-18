# GANTRY

A GenAI-powered matchday operations platform for FIFA World Cup 2026, covering all 16 host venues.

Built for stadium operations staff and FIFA officials, not fans-only: a real layered AI incident-dispatch pipeline, a bidirectional GenAI concierge that closes the loop between fans and ops, a cross-venue tournament-wide oversight view, and a QR-code kiosk that gets a real incident report from a gate steward's phone to an ops dashboard with zero login, in one tap.

## What's actually real here

Every "live" number in this app is either a genuine API call or an explicitly-labeled model — nothing is presented as sensor data that isn't. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full breakdown of what's real, what's modeled, and what was deliberately left out (WattTime grid-carbon data, because the available account is scoped to the wrong region for any of the 16 real venues — shown nowhere rather than shown misleadingly).

**Live external data:** OpenStreetMap Overpass (accessibility/transit/parking), NOAA/NWS (severe weather alerts), US Census ACS (language demographics), EPA AirNow (air quality), Transitland (real NJ Transit bus activity at MetLife).

**AI-driven, not just AI-branded:** a real three-layer LLM pipeline (Normalizer → Forecaster → Action Engine) turns a free-text incident report into a forecast and a dispatch order, and a constrained, multilingual GenAI concierge answers fan questions grounded in that same live data — with a real bidirectional link between the two (an active staff incident changes what the concierge tells a fan; a fan reporting real congestion can create a real staff-visible incident). Full prompt-level design rationale, with every system prompt quoted verbatim from source, in [`PROMPT_ENGINEERING.md`](./PROMPT_ENGINEERING.md).

## Core features

- **Tournament HQ** — live incident status across all 16 host venues at once, the one view built specifically for a FIFA official rather than single-venue staff.
- **Venue Overview / Zone Monitor / Crowd Flow** — real map (MapLibre), modeled gate-density heatmap (transit proximity + real local time-of-day, never `Math.random()`), one-click incident flagging straight from a high-density zone.
- **Ask Gantry** — floating GenAI concierge with two modes: fan Q&A (multilingual, voice in/out via the browser's native Web Speech API, zero extra API cost) and staff incident reporting, routed through the same real AI pipeline.
- **QR gate quick-report** — a printed QR code per gate opens a public, no-login, one-tap incident page for stadium stewards; reports relay into the authenticated dashboard's Action Feed within one poll cycle. See `SECURITY.md` for why this is safe to leave public.
- **Anomaly / Dispatch / Security views** — full audit trail of every AI-generated forecast and dispatch order, filterable by severity, with a real resolve/dismiss workflow.
- Google OAuth on every dashboard route; the landing/marketing page and the QR kiosk are the only intentionally public surfaces.

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — real system design decisions, including the actual bugs that shaped them (a Zustand infinite-render footgun, a venue-state refactor forced by a real product requirement, a Cloudflare deploy failure and its root cause).
- [`PROMPT_ENGINEERING.md`](./PROMPT_ENGINEERING.md) — the real system prompts behind the layered dispatch pipeline and the concierge, quoted verbatim, with the actual design rationale behind each choice.
- [`SECURITY.md`](./SECURITY.md) — real security posture, including a vulnerability that was actually found and fixed during development (API routes briefly reachable without authentication), not a hypothetical checklist.
- [`TESTING.md`](./TESTING.md) — what's automated (and why the auth boundary, specifically, is what's tested), what was manually verified end-to-end with real evidence, and what's honestly not covered yet.

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in real keys — see below
npm run dev
```

### Environment variables

| Variable | Required for | Behavior if missing |
|---|---|---|
| `GROQ_API_KEY` | The AI pipeline and concierge | Falls back to deterministic stub logic — the app stays usable, just less nuanced |
| `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in | Required — see Google Cloud Console setup below |
| `CENSUS_API_KEY` | Language demographics context | That section of live context is silently omitted |
| `AIRNOW_API_KEY` | Air quality context | Silently omitted |
| `TRANSITLAND_API_KEY` | Real bus-activity signal at MetLife | Falls back to the transit-proximity-only model |

`AUTH_SECRET` can be generated with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Google OAuth needs a project in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) with an authorized redirect URI of `http://localhost:3000/api/auth/callback/google` for local dev.

### Testing

```bash
npm run build && npm run start   # tests run against a real production build
npm test
```

### Deploying

Deploys to Cloudflare Workers via the OpenNext adapter:

```bash
npm run deploy
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md#deployment-cloudflare-workers-via-opennext-and-a-real-failure-that-shaped-it) for the two real Cloudflare-specific constraints this project hit (no `sharp` binary for `next/image`, and why `wrangler.jsonc`/`open-next.config.ts` are committed rather than left to regenerate on every build).

## Tech stack

Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS · Zustand · MapLibre GL · Recharts · Framer Motion · NextAuth v5 (Google OAuth) · Groq (`llama-3.3-70b-versatile`) · Playwright
