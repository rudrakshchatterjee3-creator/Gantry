import type { ZoneId, ZoneTelemetry, SeverityLevel } from "@/lib/types";
import type { Venue } from "@/lib/external/venues";
import { computeGateLoadPct } from "@/lib/ui/gate-load-model";
import { SECTOR_ZONE_MAP, GATE_DENSITY_WARNING, GATE_DENSITY_CRITICAL } from "@/lib/ui/gate-sectors";

// --- Ambient Telemetry Model --------------------------------------------------
// There are no real IoT sensors — no free/paid public source publishes real
// stadium turnstile/occupancy data anywhere. Gate density comes from
// lib/ui/gate-load-model.ts, a deterministic model (real transit-activity
// weight + real local time-of-day + smooth non-random motion), not
// Math.random(). Concourse traffic has even less real-world signal
// available (no per-concourse transit data exists), so it uses a simplified
// version of the same deterministic time-of-day + motion curve, kept
// separate from gate density's transit-weighted model so the two don't look
// like they share a real signal they don't.

export const ZONES: { id: ZoneId; name: string }[] = [
  { id: "gate-a", name: "Gate A" },
  { id: "gate-b", name: "Gate B" },
  { id: "gate-c", name: "Gate C" },
  { id: "gate-d", name: "Gate D" },
  { id: "concourse-north", name: "Concourse North" },
  { id: "concourse-south", name: "Concourse South" },
  { id: "concourse-east", name: "Concourse East" },
  { id: "concourse-west", name: "Concourse West" },
];

export { GATE_DENSITY_WARNING, GATE_DENSITY_CRITICAL };

function classifySeverity(gateDensityPct: number): SeverityLevel {
  if (gateDensityPct >= GATE_DENSITY_CRITICAL) return "critical";
  if (gateDensityPct >= GATE_DENSITY_WARNING) return "warning";
  return "normal";
}

const GATE_PHASE_OFFSET: Record<ZoneId, number> = {
  "gate-a": 0,
  "gate-b": Math.PI / 2,
  "gate-c": Math.PI,
  "gate-d": (3 * Math.PI) / 2,
  "concourse-north": 0.3,
  "concourse-south": 1.1,
  "concourse-east": 1.9,
  "concourse-west": 2.7,
};

/**
 * Generates one modeled ambient telemetry reading per zone for the given
 * venue — the baseline "general crowd flow" backdrop the StadiumGrid
 * heatmap shows when no staff incident report has recently named a zone
 * (see useStadiumStore's zoneOverrides, which take precedence over this
 * ambient data for 90s). `gateTransitWeights` (0-1 per gate ZoneId) comes
 * from real Overpass/Transitland proximity data — see
 * lib/store/useAmbientTelemetry.ts.
 */
export function generateZoneTelemetry(
  venue: Venue,
  gateTransitWeights: Partial<Record<ZoneId, number>> = {}
): ZoneTelemetry[] {
  const timestamp = new Date().toISOString();
  const now = new Date();
  const isGateZone = (id: ZoneId) => SECTOR_ZONE_MAP.some((s) => s.zoneId === id);

  return ZONES.map(({ id, name }) => {
    const isGate = isGateZone(id);
    const phaseOffset = GATE_PHASE_OFFSET[id] ?? 0;

    const gateDensityPct = isGate
      ? computeGateLoadPct({
          transitWeight: gateTransitWeights[id] ?? 0.3,
          timeZone: venue.timeZone,
          phaseOffset,
          now,
        })
      : computeGateLoadPct({ transitWeight: 0.2, timeZone: venue.timeZone, phaseOffset, now }) * 0.8;

    const turnstileThroughput = isGate ? Math.round(gateDensityPct * 2.4) : 0;
    const concourseTrafficPct = computeGateLoadPct({
      transitWeight: 0.25,
      timeZone: venue.timeZone,
      phaseOffset: phaseOffset + 0.5,
      now,
    });

    return {
      zoneId: id,
      zoneName: name,
      timestamp,
      gateDensityPct,
      turnstileThroughput,
      concourseTrafficPct,
      severity: classifySeverity(gateDensityPct),
    };
  });
}
