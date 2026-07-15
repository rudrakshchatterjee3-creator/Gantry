"use client";

import { useState } from "react";
import clsx from "clsx";
import { DoorOpen, MoveHorizontal, MessageSquareWarning, Flag, Loader2 } from "lucide-react";
import { useStadiumStore, useCurrentVenueOverrides } from "@/lib/store/useStadiumStore";
import { useAmbientTelemetry } from "@/lib/store/useAmbientTelemetry";
import { ZONE_SEVERITY_STYLES } from "@/lib/ui/severity";
import type { ZoneId } from "@/lib/types";

// Detailed, sortable-by-nothing-yet table view of every zone's live
// telemetry — the granular counterpart to the Overview page's 4-sector
// heatmap, which only surfaces the 4 primary gates. This shows all 8 zones
// (gates + concourses) with every field the mock IoT stream produces, and
// (like StadiumGrid) reflects any active staff incident-report override for
// a zone rather than the ambient simulated reading.
//
// >>> DATA SOURCE <<<
// Ambient readings come from lib/mock-iot.ts's generateZoneTelemetry(), a
// random number generator standing in for real turnstile/camera sensor
// feeds — no real stadium hardware is connected yet. Overrides come from
// useStadiumStore.zoneOverrides, written whenever a staff incident report
// names a zone (see components/assistant/FanAssistant.tsx's Report Incident mode).

// Flagging a zone auto-generates the report text from its own live telemetry
// (zone name + real density number) instead of making a manager retype what
// they're already looking at as a number — same real pipeline as the
// Incident Reporter bar (triggerAnomaly -> /api/simulate-anomaly), just
// triggered from the row that already shows the problem.
function generateFlagReportText(zoneName: string, density: number, isGate: boolean): string {
  const area = isGate ? "gate density" : "concourse traffic";
  return `Staff flagged from Zone Monitor — ${zoneName}: ${area} at ${density.toFixed(0)}%, requires attention.`;
}

export function ZoneTable() {
  const readings = useAmbientTelemetry((state) => state.readings);
  const zoneOverrides = useCurrentVenueOverrides();
  const triggerAnomaly = useStadiumStore((state) => state.triggerAnomaly);
  const [flaggingZoneId, setFlaggingZoneId] = useState<ZoneId | null>(null);

  const handleFlag = async (zoneId: ZoneId, zoneName: string, density: number, isGate: boolean) => {
    setFlaggingZoneId(zoneId);
    try {
      await triggerAnomaly(generateFlagReportText(zoneName, density, isGate));
    } finally {
      setFlaggingZoneId(null);
    }
  };

  return (
    <div className="rounded-lg border border-surface-border bg-surface-panel">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
          All Zones
        </h2>
        <span className="font-mono text-[11px] text-slate-500">Updates every 4s &middot; simulated feed</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5 font-medium">Zone</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Gate Density</th>
              <th className="px-4 py-2.5 font-medium">Turnstile Throughput</th>
              <th className="px-4 py-2.5 font-medium">Concourse Traffic</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {readings.map((zone) => {
              const isGate = zone.zoneId.startsWith("gate");
              const override = zoneOverrides[zone.zoneId];
              const overrideActive = Boolean(override && override.expiresAt > Date.now());
              const density = overrideActive ? override!.densityPct : zone.gateDensityPct;
              const severity = overrideActive ? override!.severity : zone.severity;
              const isFlaggable = severity !== "normal" && !overrideActive;
              const isFlagging = flaggingZoneId === zone.zoneId;

              return (
                <tr key={zone.zoneId} className="transition-colors hover:bg-surface-raised/40">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {overrideActive ? (
                        <MessageSquareWarning size={14} className="text-critical" />
                      ) : isGate ? (
                        <DoorOpen size={14} className="text-slate-500" />
                      ) : (
                        <MoveHorizontal size={14} className="text-slate-500" />
                      )}
                      <span className="font-medium text-slate-200">{zone.zoneName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">{isGate ? "Gate" : "Concourse"}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-slate-300">
                    {density.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-slate-300">
                    {isGate ? `${zone.turnstileThroughput} ppl/min` : "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-slate-300">
                    {zone.concourseTrafficPct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={clsx(
                        "inline-flex rounded border px-2 py-0.5 text-[11px] font-medium capitalize",
                        ZONE_SEVERITY_STYLES[severity].badge
                      )}
                    >
                      {overrideActive ? "reported" : severity}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {isFlaggable && (
                      <button
                        onClick={() => handleFlag(zone.zoneId, zone.zoneName, density, isGate)}
                        disabled={isFlagging}
                        className="flex items-center gap-1.5 rounded border border-surface-border px-2 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:border-critical/40 hover:bg-critical-muted hover:text-critical disabled:opacity-50"
                      >
                        {isFlagging ? <Loader2 size={11} className="animate-spin" /> : <Flag size={11} />}
                        {isFlagging ? "Flagging…" : "Flag"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {readings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">
                  Reading live feed…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
