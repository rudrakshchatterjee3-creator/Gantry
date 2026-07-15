import type { ZoneId, SeverityLevel } from "@/lib/types";

// Shared between StadiumGrid (the heatmap tiles) and VenueMap (the same
// gates plotted on a real map) so both surfaces agree on where the 4
// cardinal gates are and what counts as warning/critical density. Also the
// canonical home for the density thresholds themselves (moved here from
// lib/mock-iot.ts to break a circular import — mock-iot.ts's telemetry
// generator needs these offsets/thresholds too).
//
// Offsets are approximate (~200m from venue center in each cardinal
// direction) — none of the 16 FIFA 2026 venues has real per-gate surveyed
// coordinates in any public data source, so these place gate markers at
// illustrative positions around whichever venue is centered, not exact
// surveyed locations.
export const SECTOR_ZONE_MAP: {
  sector: string;
  zoneId: ZoneId;
  latOffset: number;
  lonOffset: number;
}[] = [
  { sector: "North", zoneId: "gate-a", latOffset: 0.0018, lonOffset: 0 },
  { sector: "South", zoneId: "gate-b", latOffset: -0.0018, lonOffset: 0 },
  { sector: "East", zoneId: "gate-c", latOffset: 0, lonOffset: 0.0024 },
  { sector: "West", zoneId: "gate-d", latOffset: 0, lonOffset: -0.0024 },
];

export const GATE_DENSITY_WARNING = 65;
export const GATE_DENSITY_CRITICAL = 80;

const HEATMAP_WARNING = GATE_DENSITY_WARNING - 5; // 60%
const HEATMAP_CRITICAL = GATE_DENSITY_CRITICAL; // 80%

export function classifyGateDensity(densityPct: number): SeverityLevel {
  if (densityPct > HEATMAP_CRITICAL) return "critical";
  if (densityPct >= HEATMAP_WARNING) return "warning";
  return "normal";
}
