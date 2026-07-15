"use client";

import clsx from "clsx";
import { useAmbientTelemetry } from "@/lib/store/useAmbientTelemetry";

// Estimated concourse wait time per zone — a simple heuristic derived from
// live concourse traffic %, not a measured queue time (no real queuing
// sensors exist yet). Scales linearly from 1 to 10 minutes.
function estimateWaitMinutes(concourseTrafficPct: number): number {
  return Math.max(1, Math.round((concourseTrafficPct / 100) * 10));
}

export function WaitTimeTable() {
  const readings = useAmbientTelemetry((state) => state.readings);

  return (
    <div className="rounded-lg border border-surface-border bg-surface-panel">
      <div className="border-b border-surface-border px-4 py-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
          Concourse Wait
        </h2>
      </div>

      <div className="divide-y divide-surface-border">
        {readings.map((zone) => {
          const wait = estimateWaitMinutes(zone.concourseTrafficPct);
          return (
            <div key={zone.zoneId} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-slate-300">{zone.zoneName}</span>
              <span
                className={clsx(
                  "font-mono tabular-nums",
                  wait >= 7 ? "text-critical" : wait >= 4 ? "text-warning" : "text-slate-400"
                )}
              >
                ~{wait} min
              </span>
            </div>
          );
        })}

        {readings.length === 0 && (
          <p className="px-4 py-8 text-center text-xs text-slate-500">Reading live feed…</p>
        )}
      </div>
    </div>
  );
}
