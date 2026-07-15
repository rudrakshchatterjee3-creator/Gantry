"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ShieldCheck, ChevronRight, Check } from "lucide-react";
import { useStadiumStore, useCurrentVenueResolutions } from "@/lib/store/useStadiumStore";
import { sopSeverityStyle } from "@/lib/ui/severity";

type SeverityFilter = "All" | "High" | "Medium" | "Low";

const FILTERS: SeverityFilter[] = ["All", "High", "Medium", "Low"];

// Full history of AI-resolved anomalies, sourced from the same store the
// Overview page's AIActionFeed writes to — this is the persistent record of
// everything the Normalizer -> Forecaster -> Action Engine chain has
// produced this session.
export function AnomalyLog() {
  const resolutions = useCurrentVenueResolutions();
  const resolveAnomaly = useStadiumStore((state) => state.resolveAnomaly);
  const [filter, setFilter] = useState<SeverityFilter>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return resolutions;
    return resolutions.filter((r) => r.sop.severity === filter);
  }, [resolutions, filter]);

  return (
    <div className="rounded-lg border border-surface-border bg-surface-panel">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
          Anomaly History
        </h2>
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "rounded px-2 py-1 text-[11px] font-medium transition-colors",
                filter === f
                  ? "bg-surface-raised text-slate-100"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 p-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="rounded-full bg-normal-muted p-2.5 text-normal">
              <ShieldCheck size={18} />
            </div>
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-slate-300">
              {resolutions.length === 0 ? "Nothing logged this session" : "No matches"}
            </p>
            <p className="text-[11px] text-slate-500">
              {resolutions.length === 0
                ? "Incidents will appear here as staff file reports."
                : `No ${filter} severity incidents logged.`}
            </p>
          </div>
        )}

        {filtered.map((resolution) => {
          const severity = (resolution.sop.severity as "High" | "Medium" | "Low") ?? "Low";
          const styles = sopSeverityStyle(severity);
          const Icon = styles.icon;

          return (
            <div key={resolution.id} className={clsx("rounded-md border bg-surface-raised/60 p-3", styles.border)}>
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
                      {new Date(resolution.resolvedAt).toLocaleString("en-US", { hour12: false })}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {resolution.status === "resolved" && (
                    <span className="rounded bg-normal-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-normal">
                      Resolved
                    </span>
                  )}
                  <span className={clsx("rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide", styles.badge)}>
                    {severity}
                  </span>
                </div>
              </div>

              <ul className="mt-2.5 space-y-1 border-t border-surface-border/60 pt-2.5">
                <li className="flex items-start gap-1.5 text-[11px] text-slate-400">
                  <ChevronRight size={11} className="mt-0.5 shrink-0 text-slate-600" />
                  {resolution.normalized.summary}
                </li>
                <li className="flex items-start gap-1.5 text-[11px] text-slate-400">
                  <ChevronRight size={11} className="mt-0.5 shrink-0 text-slate-600" />
                  Forecast: {resolution.forecast.impact} (ETA {resolution.forecast.timeToCritical}, confidence{" "}
                  {Math.round(resolution.forecast.confidence * 100)}%)
                </li>
                <li className="flex items-start gap-1.5 text-[11px] text-slate-400">
                  <ChevronRight size={11} className="mt-0.5 shrink-0 text-slate-600" />
                  Dispatch: {resolution.sop.dispatch}
                </li>
                <li className="flex items-start gap-1.5 text-[11px] text-slate-400">
                  <ChevronRight size={11} className="mt-0.5 shrink-0 text-slate-600" />
                  Action: {resolution.sop.action}
                </li>
              </ul>

              {resolution.status === "open" && (
                <button
                  onClick={() => resolveAnomaly(resolution.id)}
                  className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded border border-surface-border py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-normal/40 hover:bg-normal-muted hover:text-normal"
                >
                  <Check size={12} />
                  Mark Resolved
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
