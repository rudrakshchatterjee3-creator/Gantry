import { create } from "zustand";
import type { AnomalyResolution, SeverityLevel, ZoneId } from "@/lib/types";
import { useVenueStore } from "@/lib/store/useVenueStore";

interface ZoneOverride {
  severity: SeverityLevel;
  densityPct: number;
  reportedAt: string;
  expiresAt: number; // epoch ms — override reverts to ambient telemetry after this
}

type ResolutionsByVenue = Record<string, AnomalyResolution[]>;
type OverridesByVenue = Record<string, Partial<Record<ZoneId, ZoneOverride>>>;

interface StadiumStore {
  resolutionsByVenue: ResolutionsByVenue;
  zoneOverridesByVenue: OverridesByVenue;
  lastErrorStatus: number | null;
  triggerAnomaly: (reportText: string) => Promise<AnomalyResolution | null>;
  recordResolution: (resolution: AnomalyResolution) => void;
  resolveAnomaly: (id: string) => void;
}

const MAX_RESOLUTIONS = 20;
const OVERRIDE_TTL_MS = 90_000;

// Maps a resolved incident's severity to a representative heatmap density,
// so a staff report can visibly recolor a StadiumGrid tile even though there
// is no real density sensor behind it.
function densityForSeverity(severity: SeverityLevel): number {
  if (severity === "critical") return 92;
  if (severity === "warning") return 72;
  return 35;
}

// Keyed by venue id — a FIFA official switching from MetLife to SoFi to
// check something shouldn't wipe out MetLife's incident history, and a
// Tournament Overview page needs every venue's incidents available
// simultaneously, not just whichever one happens to be selected right now.
function applyResolution(
  resolutionsByVenue: ResolutionsByVenue,
  zoneOverridesByVenue: OverridesByVenue,
  venueId: string,
  resolution: AnomalyResolution
): Pick<StadiumStore, "resolutionsByVenue" | "zoneOverridesByVenue"> {
  const resolutions = [resolution, ...(resolutionsByVenue[venueId] ?? [])].slice(0, MAX_RESOLUTIONS);
  const zoneOverrides = { ...(zoneOverridesByVenue[venueId] ?? {}) };

  const { zoneId, severity } = resolution.normalized;
  if (zoneId) {
    zoneOverrides[zoneId] = {
      severity,
      densityPct: densityForSeverity(severity),
      reportedAt: resolution.resolvedAt,
      expiresAt: Date.now() + OVERRIDE_TTL_MS,
    };
  }

  return {
    resolutionsByVenue: { ...resolutionsByVenue, [venueId]: resolutions },
    zoneOverridesByVenue: { ...zoneOverridesByVenue, [venueId]: zoneOverrides },
  };
}

// Global state for the ISC dashboard. triggerAnomaly is the single entry
// point UI components use to submit a free-text incident report and run it
// through the full layered AI pipeline. The pipeline itself (normalizer ->
// forecaster -> action-engine) runs server-side in /api/simulate-anomaly —
// it is never called directly from this client store, since two of its
// layers hold a secret Groq API key that must not reach the browser bundle.
//
// Actions read the current venue from useVenueStore internally (same
// pattern useAmbientTelemetry already uses) so call sites don't need to pass
// a venueId explicitly — they always act on whichever venue is currently
// selected in the UI they're called from.
export const useStadiumStore = create<StadiumStore>((set) => ({
  resolutionsByVenue: {},
  zoneOverridesByVenue: {},
  lastErrorStatus: null,

  triggerAnomaly: async (reportText) => {
    const venueId = useVenueStore.getState().selectedVenueId;
    try {
      const response = await fetch("/api/simulate-anomaly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reportText }),
      });
      if (!response.ok) {
        set({ lastErrorStatus: response.status });
        return null;
      }

      const { resolution }: { resolution: AnomalyResolution } = await response.json();
      set((state) => ({
        ...applyResolution(state.resolutionsByVenue, state.zoneOverridesByVenue, venueId, resolution),
        lastErrorStatus: null,
      }));
      return resolution;
    } catch (error) {
      console.error("triggerAnomaly failed:", error);
      set({ lastErrorStatus: null });
      return null;
    }
  },

  // Merges a resolution that was already computed server-side by a caller
  // other than triggerAnomaly (e.g. the Fan Assistant's congestion-report
  // path in app/api/fan-assistant/route.ts) — same effect on state, no
  // redundant fetch back to /api/simulate-anomaly.
  recordResolution: (resolution) => {
    const venueId = useVenueStore.getState().selectedVenueId;
    set((state) => applyResolution(state.resolutionsByVenue, state.zoneOverridesByVenue, venueId, resolution));
  },

  // Marks a single incident "resolved" by staff — kept in the array (so
  // Anomaly History stays a permanent audit trail) but hidden from the live
  // Action Feed, which only shows status "open". If no other still-open
  // resolution claims the same zone, its heatmap override is cleared
  // immediately rather than waiting out OVERRIDE_TTL_MS.
  resolveAnomaly: (id) => {
    const venueId = useVenueStore.getState().selectedVenueId;
    set((state) => {
      const resolutions = (state.resolutionsByVenue[venueId] ?? []).map((r) =>
        r.id === id ? { ...r, status: "resolved" as const, closedAt: new Date().toISOString() } : r
      );
      const resolution = resolutions.find((r) => r.id === id);
      const zoneOverrides = { ...(state.zoneOverridesByVenue[venueId] ?? {}) };

      const zoneId = resolution?.normalized.zoneId;
      if (zoneId && !resolutions.some((r) => r.normalized.zoneId === zoneId && r.status === "open")) {
        delete zoneOverrides[zoneId];
      }

      return {
        resolutionsByVenue: { ...state.resolutionsByVenue, [venueId]: resolutions },
        zoneOverridesByVenue: { ...state.zoneOverridesByVenue, [venueId]: zoneOverrides },
      };
    });
  },
}));

// Stable empty fallbacks — reusing the same reference every call when a
// venue has no entries yet avoids the classic Zustand/useSyncExternalStore
// "getSnapshot should be cached" infinite-render bug that a fresh `?? []`
// literal inside a selector would cause.
const EMPTY_RESOLUTIONS: AnomalyResolution[] = [];
const EMPTY_OVERRIDES: Partial<Record<ZoneId, ZoneOverride>> = {};

// Convenience hooks composing both stores — every UI consumer wants "the
// currently selected venue's" resolutions/overrides, not the full
// venue-keyed maps (that's only needed by the Tournament Overview page,
// which reads resolutionsByVenue directly).
export function useCurrentVenueResolutions(): AnomalyResolution[] {
  const venueId = useVenueStore((state) => state.selectedVenueId);
  return useStadiumStore((state) => state.resolutionsByVenue[venueId] ?? EMPTY_RESOLUTIONS);
}

export function useCurrentVenueOverrides(): Partial<Record<ZoneId, ZoneOverride>> {
  const venueId = useVenueStore((state) => state.selectedVenueId);
  return useStadiumStore((state) => state.zoneOverridesByVenue[venueId] ?? EMPTY_OVERRIDES);
}
