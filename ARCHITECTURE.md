# Architecture

This is a real account of the significant design decisions in GANTRY, several of which are second or third attempts after the first one broke in a way that was only visible once actually run — not a clean-room design document written after the fact. Where a decision reversed a real bug, that bug is named.

## Real data, with disclosed limits, everywhere

No metric in this app is fabricated and presented as sensor data. Every "live" number is either genuinely fetched from a public API, or explicitly modeled from real inputs and labeled as such:

| Signal | Source | Honesty mechanism |
|---|---|---|
| Nearby accessibility/transit/parking | OpenStreetMap Overpass API | Real, live, cached 1hr |
| Severe weather alerts | NOAA/NWS | Real, live, US venues only — returns `[]` outside the US, not an error |
| Language demographics | US Census ACS API | Real, live, US venues only, requires `CENSUS_API_KEY` |
| Air quality | EPA AirNow | Real, live, US venues only |
| Bus stop activity (MetLife only) | Transitland | Real when `TRANSITLAND_API_KEY` is configured; explicitly `null` otherwise, not a guess |
| Gate density / crowd flow | `lib/ui/gate-load-model.ts` | **Explicitly modeled**, not sensed — real transit-proximity weight + real local time-of-day (`Intl.DateTimeFormat` against the venue's actual IANA timezone) + deterministic motion, never `Math.random()`. Labeled "Modeled, not sensed" in the Settings page, not hidden behind a plausible-looking number. |
| Grid carbon intensity (WattTime) | — | **Deliberately not shown.** The available free-tier account is scoped to `CAISO_NORTH` (California), not any of the 16 real venues. The client (`lib/external/watttime.ts`) is fully implemented and left in the codebase, but never called — showing California grid data labeled as a stadium's carbon metric would be actively misleading, so it isn't shown at all rather than shown with a caveat nobody reads. |

Every external client follows the same resilience shape: cached (`lib/external/cache.ts`, a simple TTL map — one upstream call per cache window, not one per user question), timeout-guarded, and fails soft to `null`/`[]` rather than throwing — a missing API key or an unreachable upstream degrades the feature, it never crashes the page.

## Auth: real credentials over Cloudflare KV, not OAuth

GANTRY originally used Google OAuth (NextAuth v5). It was replaced with real credential auth — email/password accounts stored in a Cloudflare KV namespace, PBKDF2-hashed, a signed JWT session cookie — because a stadium official's access to an ops dashboard shouldn't be gated behind a personal Google account, and because it makes the entire access-control path auditable in this repo (`lib/auth/`) instead of delegated to a provider's opaque flow. Full design rationale and every relevant code path are in `SECURITY.md` §1.

**This meant switching how the deployed app reaches storage.** OpenNext's `getCloudflareContext()` (`lib/auth/officials-kv.ts`) only resolves a binding when the request actually flows through a Cloudflare-shaped runtime — the real deployed Worker, or `opennextjs-cloudflare preview` (Wrangler-backed) locally. It does **not** resolve under plain `next start`, which serves the `next build` output directly through Next's own Node server with no Worker context at all — confirmed by an actual thrown error (`getCloudflareContext has been called without having called initOpenNextCloudflareForDev...`) when first tried. `next dev` gets a local, Miniflare-simulated version of the same binding via `initOpenNextCloudflareForDev()`, called once in `next.config.js` — so day-to-day development needs no separate wrangler process, but the "production-like local build" verification step (and Playwright's `webServer`) had to move from `next start` to `npm run preview` for this reason. See `playwright.config.ts` and `TESTING.md`.

## State: client-only, venue-keyed, and why that mattered

There is no backend database for dashboard/incident state — accounts are the one exception (real KV, see above). Every piece of dashboard state — incident resolutions, zone overrides, ambient telemetry — lives in Zustand stores in the browser. This is a real, disclosed constraint (a page refresh loses session state), not an oversight.

**The venue-keying refactor was a real bug fix, not a design chosen up front.** The original `useStadiumStore` held one flat array of resolutions, and switching venues called `clearResolutions()` to avoid misattributing "North Gate" incidents across different stadiums. That worked, until Tournament HQ (a page for viewing *all 16 venues' status at once*) was built — and it became obvious that clearing MetLife's incidents the moment someone glanced at SoFi's dashboard was actively wrong for the one persona (a FIFA tournament official) this feature exists for. The store was restructured to key both `resolutionsByVenue` and `zoneOverridesByVenue` by venue ID:

```ts
type ResolutionsByVenue = Record<string, AnomalyResolution[]>;
```

Every UI component that only cares about "the current venue" uses a pair of convenience hooks (`useCurrentVenueResolutions`, `useCurrentVenueOverrides`) that compose the venue-selection store with the keyed data store — so most consumers didn't need to change at all, only the store's internals did.

**A real Zustand footgun found and fixed in the same refactor:** the naive version of those convenience hooks used `state.resolutionsByVenue[venueId] ?? []` inline inside the selector. That `?? []` allocates a *new* array reference every single call, and Zustand (via React's `useSyncExternalStore`) can enter an infinite re-render loop when a selector's output is referentially unstable even though the underlying state hasn't changed — a real, documented class of bug, not a hypothetical one. Fixed with module-level stable constants:

```ts
const EMPTY_RESOLUTIONS: AnomalyResolution[] = [];
// ...
return useStadiumStore((state) => state.resolutionsByVenue[venueId] ?? EMPTY_RESOLUTIONS);
```

**Another real crash, in the same family of store-initialization gotchas:** `useAmbientTelemetry`'s first version called `get()` synchronously inside its own `create((set, get) => {...})` initializer body — `get()` only returns a valid value once Zustand has *finished* constructing the store, so calling it inline threw `Cannot read properties of undefined` on every single page load. Invisible to `tsc`/`eslint`; immediately obvious as a blank white page in a real browser. Fixed by deferring the first tick with `setTimeout(..., 0)`.

## Route structure: why the landing page needed its own layout

The app root originally had one `app/layout.tsx` wrapping every page in the dashboard chrome (sidebar, top bar). When a public, pre-auth landing page (`/welcome`) was added, it rendered *inside* that same dashboard chrome — sidebar and all — because Next.js layouts are additive by nesting, not opt-in per page. The fix was restructuring the dashboard routes into a route group, `app/(dashboard)/`, with its own layout carrying the chrome, leaving the root `app/layout.tsx` minimal (fonts and not much else) so `/welcome`, `/report/[venueId]/[gateId]`, and any other public-by-design page render as genuinely standalone pages, not dashboard pages with the furniture visually stripped.

## The AI pipeline is layered; the fan concierge is constrained. See `PROMPT_ENGINEERING.md`

The incident-dispatch pipeline (Normalizer → Forecaster → Action Engine) and the fan-facing concierge use two deliberately different prompting strategies for two structurally different problems — full rationale, with the actual system prompts quoted verbatim, is in `PROMPT_ENGINEERING.md` rather than duplicated here.

## Deployment: Cloudflare Workers via OpenNext, and a real failure that shaped it

The app deploys to Cloudflare Workers through the OpenNext adapter, chosen over Vercel for this project. Two real, non-obvious constraints shaped the final setup, both discovered by an actual failed deploy rather than anticipated in advance:

1. **Cloudflare Workers has no `sharp` binary**, so `next/image`'s default on-the-fly resize/format-conversion pipeline breaks silently in production there. `next.config.js` sets `images.unoptimized: true` explicitly, after confirming this against OpenNext's own documentation rather than guessing — `<Image>` still provides lazy-loading and layout-stable rendering without it, which is what actually mattered for a real, measured scroll-performance problem (see the "images" and "scroll lag" history in this repo's commit log for the concrete before/after).
2. **Cloudflare's build tooling regenerates `wrangler.jsonc`/`open-next.config.ts` from scratch on every single build** unless you commit your own — which is inherently non-reproducible, and was the actual root cause of a real deploy failure (`Service binding WORKER_SELF_REFERENCE references Worker 'intelligent-stadium-command' which was not found` — a stale name mismatch between an ephemeral auto-generated config and the real deployed Worker). Fixed by committing `wrangler.jsonc` and `open-next.config.ts` directly, and renaming `package.json`'s `name` field to match the real Worker name, so the self-reference binding OpenNext derives is stable and correct on every build, not re-guessed. A committed `wrangler.jsonc` also has a real consequence for the Cloudflare dashboard's separate "Deploy command" setting: once it exists, `wrangler deploy` stops auto-wrapping the build in OpenNext's build step (it assumes an already-configured Workers project), so the dashboard's Deploy command has to be `npm run deploy` (which runs the real `opennextjs-cloudflare build && opennextjs-cloudflare deploy` sequence), not a bare `wrangler deploy`.
3. **The KV namespace referenced in `wrangler.jsonc` (`OFFICIALS_KV`, backing official account storage) has to exist on Cloudflare before the first real deploy** — `npx wrangler kv namespace create OFFICIALS_KV` (or the dashboard equivalent), with the returned id pasted into `wrangler.jsonc`'s `kv_namespaces` entry. Unlike the app's other external integrations, there's no "missing key, fails soft to null" story here by design — officials' accounts are exactly the data this app should refuse to silently drop.
