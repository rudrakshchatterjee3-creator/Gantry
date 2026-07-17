import type { AnomalyResolution } from "@/lib/types";

// --- Quick Report Relay -------------------------------------------------------
// The public /report/[venueId]/[gateId] page runs in a completely separate
// browser session from the ops dashboard (a steward's phone vs. a manager's
// laptop) — this app has no database, every other piece of state lives in a
// per-tab Zustand store. Without this relay, a quick report would only ever
// confirm locally to the steward and never reach the Action Feed a manager
// actually watches. Same in-memory, process-wide, resets-on-restart pattern
// already used by lib/external/rate-limiter.ts — acceptable for a hackathon
// demo, would become a real datastore (Redis/Postgres) for production.

const MAX_PER_VENUE = 20;
const reportsByVenue = new Map<string, AnomalyResolution[]>();

export function pushQuickReport(venueId: string, resolution: AnomalyResolution): void {
  const existing = reportsByVenue.get(venueId) ?? [];
  reportsByVenue.set(venueId, [resolution, ...existing].slice(0, MAX_PER_VENUE));
}

export function getRecentQuickReports(venueId: string): AnomalyResolution[] {
  return reportsByVenue.get(venueId) ?? [];
}
