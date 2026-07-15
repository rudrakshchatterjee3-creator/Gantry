"use client";

import clsx from "clsx";
import { ShieldAlert, Lock } from "lucide-react";
import { GATE_DENSITY_WARNING, GATE_DENSITY_CRITICAL } from "@/lib/mock-iot";
import { useCurrentVenueResolutions } from "@/lib/store/useStadiumStore";
import { useAmbientTelemetry } from "@/lib/store/useAmbientTelemetry";
import { ZONE_SEVERITY_STYLES, THREAT_LEVEL_META } from "@/lib/ui/severity";
import type { SeverityLevel } from "@/lib/types";

// --- Security Overview -------------------------------------------------------
// There is no dedicated security-sensor feed in this system (no access
// control logs, CCTV threat detection, etc.) — this view is honest about
// that: it re-derives a threat posture from the same crowd-density
// telemetry every other page uses, on the reasoning that overcrowded gates
// are the primary security-relevant condition a stadium ops team tracks in
// real time. High-severity AI dispatch orders are surfaced here as the
// closest analog to a "security event."

export function SecurityOverview() {
  const readings = useAmbientTelemetry((state) => state.readings);
  const resolutions = useCurrentVenueResolutions();

  const criticalCount = readings.filter((r) => r.severity === "critical").length;
  const warningCount = readings.filter((r) => r.severity === "warning").length;

  const threatLevel: SeverityLevel = criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "normal";
  const threat = THREAT_LEVEL_META[threatLevel];
  const threatStyles = ZONE_SEVERITY_STYLES[threatLevel];
  const ThreatIcon = threat.icon;

  const securityEvents = resolutions.filter((r) => r.sop.severity === "High");

  return (
    <div className="flex flex-col gap-6">
      <div className={clsx("flex items-center gap-4 rounded-lg border p-4", threatStyles.bg, threatStyles.border)}>
        <div className={clsx("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", threatStyles.bg)}>
          <ThreatIcon size={22} className={threatStyles.text} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Stadium Threat Level</p>
          <p className={clsx("font-display text-xl font-semibold", threatStyles.text)}>{threat.label}</p>
        </div>
        <p className="ml-auto max-w-xs text-right text-[11px] text-slate-500">
          Derived from live gate-density readings — {criticalCount} critical, {warningCount} warning zone(s).
        </p>
      </div>

      <div className="rounded-lg border border-surface-border bg-surface-panel">
        <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
          <Lock size={14} className="text-slate-400" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
            Access Control Zones
          </h2>
        </div>
        <div className="grid grid-cols-1 divide-y divide-surface-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {readings
            .filter((r) => r.zoneId.startsWith("gate"))
            .map((zone) => {
              const status =
                zone.gateDensityPct >= GATE_DENSITY_CRITICAL
                  ? "Restricted"
                  : zone.gateDensityPct >= GATE_DENSITY_WARNING
                  ? "Monitor"
                  : "Nominal";
              const level: SeverityLevel =
                zone.gateDensityPct >= GATE_DENSITY_CRITICAL
                  ? "critical"
                  : zone.gateDensityPct >= GATE_DENSITY_WARNING
                  ? "warning"
                  : "normal";
              return (
                <div key={zone.zoneId} className="p-4">
                  <p className="text-xs font-medium text-slate-300">{zone.zoneName}</p>
                  <p className={clsx("mt-1 text-sm font-semibold", ZONE_SEVERITY_STYLES[level].text)}>{status}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {zone.gateDensityPct.toFixed(0)}% occupancy
                  </p>
                </div>
              );
            })}
        </div>
      </div>

      <div className="rounded-lg border border-surface-border bg-surface-panel">
        <div className="border-b border-surface-border px-4 py-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
            Recent Security Events
          </h2>
        </div>
        <div className="divide-y divide-surface-border">
          {securityEvents.length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-slate-500">
              No high-severity events recorded this session.
            </p>
          )}
          {securityEvents.map((event) => (
            <div key={event.id} className="flex items-start gap-3 px-4 py-3">
              <ShieldAlert size={14} className="mt-0.5 shrink-0 text-critical" />
              <div>
                <p className="text-xs font-medium text-slate-200">
                  Crowd surge risk — {event.normalized.zoneLabel}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {new Date(event.resolvedAt).toLocaleString("en-US", { hour12: false })} &middot;{" "}
                  {event.sop.dispatch}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
