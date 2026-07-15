"use client";

import clsx from "clsx";
import { Radio, ChevronRight, ShieldCheck, Quote, Check } from "lucide-react";
import { useStadiumStore, useCurrentVenueResolutions } from "@/lib/store/useStadiumStore";
import { sopSeverityStyle } from "@/lib/ui/severity";

// --- AIActionFeed: The Copilot Panel -----------------------------------------
// Displays AI-generated Standard Operating Procedures produced by the
// layered orchestration pipeline (normalizer -> forecaster -> action
// engine). This panel is purely a renderer of useStadiumStore.resolutions —
// it has no data source of its own. Resolutions only enter the store via a
// staff-submitted incident report (Ask Gantry's Report Incident mode, see
// components/assistant/FanAssistant.tsx -> useStadiumStore.triggerAnomaly ->
// POST /api/simulate-anomaly). There is no automatic sensor-driven trigger
// in this system.

export function AIActionFeed() {
  const allResolutions = useCurrentVenueResolutions();
  const resolveAnomaly = useStadiumStore((state) => state.resolveAnomaly);
  const resolutions = allResolutions.filter((r) => r.status === "open");

  return (
    <div className="flex h-full flex-col rounded-lg border border-surface-border bg-surface-panel">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-slate-400" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
            Action Feed
          </h2>
        </div>
        <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[11px] text-slate-400">
          {resolutions.length} active
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {resolutions.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="rounded-full bg-normal-muted p-2.5 text-normal">
              <ShieldCheck size={18} />
            </div>
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-slate-300">
              All clear
            </p>
            <p className="max-w-[200px] text-[11px] text-slate-500">
              No incidents reported. File one below the moment something needs attention.
            </p>
          </div>
        )}

        {resolutions.map((resolution) => {
          const severity = (resolution.sop.severity as "High" | "Medium" | "Low") ?? "Low";
          const styles = sopSeverityStyle(severity);
          const Icon = styles.icon;

          return (
            <div
              key={resolution.id}
              className={clsx("rounded-md border bg-surface-raised/60 p-3", styles.border)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <div className={clsx("mt-0.5 rounded p-1", styles.bg)}>
                    <Icon size={13} className={styles.text} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-100">
                      {resolution.normalized.zoneLabel} — {severity} response
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {new Date(resolution.resolvedAt).toLocaleTimeString("en-US", { hour12: false })} &middot;{" "}
                      {resolution.sop.dispatch}
                    </p>
                  </div>
                </div>
                <span className={clsx("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide", styles.badge)}>
                  {severity}
                </span>
              </div>

              <div className="mt-2.5 flex items-start gap-1.5 rounded border border-surface-border/60 bg-surface/40 px-2 py-1.5 text-[11px] italic text-slate-500">
                <Quote size={11} className="mt-0.5 shrink-0 text-slate-600" />
                {resolution.reportText}
              </div>

              <ul className="mt-2 space-y-1 border-t border-surface-border/60 pt-2">
                <li className="flex items-start gap-1.5 text-[11px] text-slate-400">
                  <ChevronRight size={11} className="mt-0.5 shrink-0 text-slate-600" />
                  Forecast: {resolution.forecast.impact} (ETA {resolution.forecast.timeToCritical})
                </li>
                <li className="flex items-start gap-1.5 text-[11px] text-slate-400">
                  <ChevronRight size={11} className="mt-0.5 shrink-0 text-slate-600" />
                  Action: {resolution.sop.action}
                </li>
              </ul>

              <button
                onClick={() => resolveAnomaly(resolution.id)}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded border border-surface-border py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-normal/40 hover:bg-normal-muted hover:text-normal"
              >
                <Check size={12} />
                Mark Resolved
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
