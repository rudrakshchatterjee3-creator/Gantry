"use client";

import { Users, AlertTriangle, Clock } from "lucide-react";
import { useCurrentVenueResolutions } from "@/lib/store/useStadiumStore";
import { useAmbientTelemetry } from "@/lib/store/useAmbientTelemetry";
import { useVenueStore } from "@/lib/store/useVenueStore";

// --- MetricsHeader: The Stats -----------------------------------------------
// Top-row global metrics: total capacity, active alerts, and average
// concourse wait time. "Active Alerts" reflects AnomalyResolutions in the
// Zustand store — which are only ever created from staff-submitted incident
// reports (via Ask Gantry's Report Incident mode). There is no
// automatic sensor-driven trigger in this system. Capacity is the selected
// venue's real seating capacity (lib/external/venues.ts), not a fixed
// placeholder — occupied count is still a modeled estimate (see
// lib/ui/gate-load-model.ts), never a real sensor reading.

export function MetricsHeader() {
  const readings = useAmbientTelemetry((state) => state.readings);
  const resolutions = useCurrentVenueResolutions();
  const venue = useVenueStore((state) => state.selectedVenue);

  const avgConcourseTraffic = readings.length
    ? readings.reduce((sum, r) => sum + r.concourseTrafficPct, 0) / readings.length
    : 0;
  // Rough heuristic: wait time scales with concourse congestion, floor of 1 min.
  const avgWaitMinutes = Math.max(1, Math.round((avgConcourseTraffic / 100) * 9));

  const activeAlerts = resolutions.filter((r) => r.status === "open").length;
  const occupiedCapacity = Math.round((avgConcourseTraffic / 100) * venue.capacity);

  return (
    <div className="rounded-lg border border-surface-border bg-surface-panel p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          icon={Users}
          label="Total Capacity"
          value={`${occupiedCapacity.toLocaleString()} / ${venue.capacity.toLocaleString()}`}
          tone="text-slate-200"
        />
        <Stat
          icon={AlertTriangle}
          label="Active Alerts"
          value={activeAlerts.toString()}
          tone={activeAlerts > 0 ? "text-critical" : "text-normal"}
        />
        <Stat
          icon={Clock}
          label="Avg. Concourse Wait"
          value={`${avgWaitMinutes} min`}
          tone={avgWaitMinutes >= 6 ? "text-warning" : "text-slate-200"}
        />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-raised">
        <Icon size={16} className="text-slate-400" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className={`font-display text-xl font-bold tabular-nums ${tone}`}>{value}</p>
      </div>
    </div>
  );
}
