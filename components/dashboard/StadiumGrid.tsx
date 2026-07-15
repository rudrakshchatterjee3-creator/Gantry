"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { DoorOpen, MessageSquareWarning } from "lucide-react";
import { useCurrentVenueOverrides } from "@/lib/store/useStadiumStore";
import { useAmbientTelemetry } from "@/lib/store/useAmbientTelemetry";
import { ZONE_SEVERITY_STYLES } from "@/lib/ui/severity";
import { SECTOR_ZONE_MAP, classifyGateDensity } from "@/lib/ui/gate-sectors";

// --- StadiumGrid: The Heatmap ------------------------------------------------
// Visualizes the stadium as 4 cardinal gate sectors (North/South/East/West) —
// see also VenueMap.tsx, which plots these same 4 gates on a real map using
// the same SECTOR_ZONE_MAP/classifyGateDensity (lib/ui/gate-sectors.ts).
// Each sector's fill color is normally driven by ambient simulated telemetry
// (lib/mock-iot.ts — there are no real sensors), but is overridden the
// moment a staff incident report names that zone: useStadiumStore holds a
// zoneOverrides map keyed by ZoneId, written by triggerAnomaly() whenever
// the Normalizer extracts a zone from a report. An override wins over the
// ambient reading for 90 seconds, then decays back automatically.
//   < 60%        -> emerald (normal)
//   60% - 80%    -> amber (warning)
//   > 80%        -> red, pulsing (critical)

export function StadiumGrid() {
  const readings = useAmbientTelemetry((state) => state.readings);
  const zoneOverrides = useCurrentVenueOverrides();
  const readingsByZone = useMemo(() => new Map(readings.map((r) => [r.zoneId, r])), [readings]);

  return (
    <div className="rounded-lg border border-surface-border bg-surface-panel">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
          Sector Heatmap
        </h2>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-normal" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Warning
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-critical" /> Critical
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4">
        {SECTOR_ZONE_MAP.map(({ sector, zoneId }) => {
          const reading = readingsByZone.get(zoneId);
          const override = zoneOverrides[zoneId];
          const overrideActive = Boolean(override && override.expiresAt > Date.now());

          const density = overrideActive ? override!.densityPct : reading?.gateDensityPct ?? 0;
          const level = overrideActive ? override!.severity : classifyGateDensity(density);
          const styles = ZONE_SEVERITY_STYLES[level];

          return (
            <div
              key={zoneId}
              className={clsx(
                "flex aspect-[4/3] flex-col justify-between rounded-lg border p-4 transition-colors",
                styles.tile,
                styles.ring
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={clsx("h-2 w-2 rounded-full", styles.dot)} />
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-300">
                    {sector} Gate
                  </p>
                </div>
                {overrideActive ? (
                  <MessageSquareWarning size={14} className={styles.text} />
                ) : (
                  <DoorOpen size={14} className={styles.text} />
                )}
              </div>

              <div>
                <p className={clsx("font-mono text-3xl font-semibold tabular-nums", styles.text)}>
                  {density.toFixed(0)}
                  <span className="text-base">%</span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {overrideActive
                    ? "Reported by staff"
                    : `${reading?.zoneName ?? "Reading feed"} · capacity`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
