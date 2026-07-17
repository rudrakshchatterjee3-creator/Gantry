import { create } from "zustand";
import { generateZoneTelemetry } from "@/lib/mock-iot";
import { useVenueStore } from "@/lib/store/useVenueStore";
import { useStadiumStore } from "@/lib/store/useStadiumStore";
import { SECTOR_ZONE_MAP } from "@/lib/ui/gate-sectors";
import type { ZoneId, ZoneTelemetry, AnomalyResolution } from "@/lib/types";
import type { Venue } from "@/lib/external/venues";

interface VenuePoi {
  category: string;
  lat: number;
  lon: number;
}

interface AmbientTelemetryStore {
  readings: ZoneTelemetry[];
  gateTransitWeights: Partial<Record<ZoneId, number>>;
}

const TICK_MS = 4000;

function distanceSq(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat1 - lat2;
  const dLon = lon1 - lon2;
  return dLat * dLat + dLon * dLon;
}

// Buckets real Overpass transit POIs (fetched once per venue selection) to
// whichever of the 4 gate offset positions is closest, then normalizes each
// gate's count into a 0-1 weight the gate-load model uses as its real
// transit-activity signal. If Transitland reports real NJ Transit bus stop
// activity (MetLife only, when TRANSITLAND_API_KEY is set), that boosts all
// 4 gates evenly since it's a venue-wide count, not per-gate.
function computeGateTransitWeights(
  venue: Venue,
  pois: VenuePoi[],
  transitActivity: { nearbyStopCount: number } | null
): Partial<Record<ZoneId, number>> {
  const counts: Partial<Record<ZoneId, number>> = {};

  for (const poi of pois) {
    if (poi.category !== "transit") continue;
    let closestZone: ZoneId | null = null;
    let closestDist = Infinity;
    for (const { zoneId, latOffset, lonOffset } of SECTOR_ZONE_MAP) {
      const d = distanceSq(poi.lat, poi.lon, venue.lat + latOffset, venue.lon + lonOffset);
      if (d < closestDist) {
        closestDist = d;
        closestZone = zoneId;
      }
    }
    if (closestZone) counts[closestZone] = (counts[closestZone] ?? 0) + 1;
  }

  const transitBoost = transitActivity ? Math.min(transitActivity.nearbyStopCount / 20, 0.4) : 0;

  const weights: Partial<Record<ZoneId, number>> = {};
  for (const { zoneId } of SECTOR_ZONE_MAP) {
    const baseWeight = Math.min((counts[zoneId] ?? 0) / 4, 1);
    weights[zoneId] = Math.min(baseWeight + transitBoost, 1);
  }
  return weights;
}

// Single shared interval for the whole app, started once when this module
// is first imported — replaces every component independently calling
// subscribeToMockTelemetry() with its own setInterval and its own
// generateZoneTelemetry() call. Previously, up to 7 components mounted on
// one page each ran redundant random generation and triggered their own
// re-render every 4s tick. Now there's exactly one tick, one generation
// call, and every component reads via a Zustand selector.
//
// Also venue-aware: whenever useVenueStore's selection changes, refetches
// real Overpass/Transitland data for that venue and recomputes
// gateTransitWeights, which feed the gate-load model on every subsequent
// tick.
// Reports filed from the public, unauthenticated /report/[venueId]/[gateId]
// quick-report page arrive server-side, not through this browser tab's own
// triggerAnomaly() call — polling is how they reach the Action Feed a
// manager is watching. Tracked per module lifetime (resets on reload), same
// dedupe-by-id pattern CriticalAlertWatcher already uses.
const seenQuickReportIds = new Set<string>();

async function pollQuickReports(venueId: string) {
  try {
    const response = await fetch(`/api/quick-reports?venueId=${venueId}`);
    if (!response.ok) return;
    const data: { resolutions: AnomalyResolution[] } = await response.json();
    for (const resolution of data.resolutions ?? []) {
      if (seenQuickReportIds.has(resolution.id)) continue;
      seenQuickReportIds.add(resolution.id);
      useStadiumStore.getState().recordResolution(resolution);
    }
  } catch {
    // fail soft — a missed poll just means a report shows up a tick later
  }
}

export const useAmbientTelemetry = create<AmbientTelemetryStore>((set, get) => {
  async function refreshGateWeights(venue: Venue) {
    try {
      const response = await fetch(`/api/venue-pois?venueId=${venue.id}`);
      const data: { pois: VenuePoi[]; transitActivity: { nearbyStopCount: number } | null } =
        await response.json();
      set({ gateTransitWeights: computeGateTransitWeights(venue, data.pois ?? [], data.transitActivity) });
    } catch {
      set({ gateTransitWeights: {} }); // fail soft — model falls back to its neutral default
    }
  }

  if (typeof window !== "undefined") {
    const tick = () => {
      const venue = useVenueStore.getState().selectedVenue;
      set({ readings: generateZoneTelemetry(venue, get().gateTransitWeights) });
      void pollQuickReports(venue.id);
    };

    // Deferred, not called synchronously here: `get()` only returns valid
    // state once this initializer has returned and Zustand has finished
    // constructing the store — calling tick() inline crashes with
    // "Cannot read properties of undefined (reading 'gateTransitWeights')".
    setTimeout(() => {
      tick();
      setInterval(tick, TICK_MS);
    }, 0);
    void refreshGateWeights(useVenueStore.getState().selectedVenue);

    useVenueStore.subscribe((state, prevState) => {
      if (state.selectedVenueId !== prevState.selectedVenueId) {
        void refreshGateWeights(state.selectedVenue);
      }
    });
  }

  return { readings: [], gateTransitWeights: {} };
});
