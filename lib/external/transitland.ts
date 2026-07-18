import { cached } from "@/lib/external/cache";
import type { Venue } from "@/lib/external/venues";

// --- Transitland API ----------------------------------------------------------
// Real transit data for MetLife Stadium via Transitland (transit.land), which
// aggregates GTFS/GTFS-realtime from many agencies behind one API —
// specifically NJ Transit's bus feed (f-dr5-nj~transit~bus). Verified during
// implementation: the v2 REST API returns 401 without a key — free to sign up
// for, but key-gated, same pattern as Census/AirNow in this app
// (TRANSITLAND_API_KEY, returns null immediately if unset).
//
// This counts real nearby stops served by that feed as the activity signal,
// not live vehicle arrival times: the exact shape of Transitland's realtime
// departures endpoint couldn't be verified without a working key during
// implementation, and guessing at an unverified endpoint shape is exactly
// the kind of thing this app has tried hard to avoid. Stop density is a
// coarser but honestly-verifiable real signal — swap for live departures
// once a key is available to test against.

const NJ_TRANSIT_BUS_FEED = "f-dr5-nj~transit~bus";
const CACHE_TTL_MS = 30 * 60 * 1000;

export interface TransitActivity {
  feedOnestopId: string;
  nearbyStopCount: number;
}

/**
 * Real count of NJ Transit bus stops within ~2km of the venue. Only
 * meaningful for MetLife today (the one feed this app has wired up) —
 * returns null for every other venue, and null if TRANSITLAND_API_KEY is
 * unset or the request fails.
 */
export async function getTransitActivity(venue: Venue): Promise<TransitActivity | null> {
  const apiKey = process.env.TRANSITLAND_API_KEY;
  if (!apiKey || venue.id !== "metlife") return null;

  return cached(`transitland:stops:${venue.id}`, CACHE_TTL_MS, async () => {
    try {
      const url =
        `https://transit.land/api/v2/rest/stops?lat=${venue.lat}&lon=${venue.lon}` +
        `&radius=2000&served_by_onestop_ids=${NJ_TRANSIT_BUS_FEED}&apikey=${apiKey}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) return null;

      const data = (await response.json()) as { stops?: unknown[] };
      const stops = Array.isArray(data.stops) ? data.stops : [];

      return { feedOnestopId: NJ_TRANSIT_BUS_FEED, nearbyStopCount: stops.length };
    } catch {
      return null;
    }
  });
}
