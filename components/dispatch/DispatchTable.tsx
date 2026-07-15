"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, Radio } from "lucide-react";
import { useCurrentVenueResolutions } from "@/lib/store/useStadiumStore";
import { sopSeverityStyle } from "@/lib/ui/severity";

// Operational log of every dispatch order the Action Engine has generated.
// "Acknowledge" is tracked locally (not persisted to the store or a
// backend) — it's a UI-only marker so an operator can visually triage which
// dispatches they've already actioned during this session.
export function DispatchTable() {
  const resolutions = useCurrentVenueResolutions();
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  const toggleAcknowledged = (id: string) => {
    setAcknowledgedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-surface-border bg-surface-panel">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-slate-400" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
            Dispatch Log
          </h2>
        </div>
        <span className="text-[11px] text-slate-500">{resolutions.length} orders this session</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5 font-medium">Time</th>
              <th className="px-4 py-2.5 font-medium">Zone</th>
              <th className="px-4 py-2.5 font-medium">Severity</th>
              <th className="px-4 py-2.5 font-medium">Unit Dispatched</th>
              <th className="px-4 py-2.5 font-medium">Action</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {resolutions.map((resolution) => {
              const acknowledged = acknowledgedIds.has(resolution.id);
              return (
                <tr key={resolution.id} className="transition-colors hover:bg-surface-raised/40">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">
                    {new Date(resolution.resolvedAt).toLocaleTimeString("en-US", { hour12: false })}
                  </td>
                  <td className="px-4 py-2.5 text-slate-200">{resolution.normalized.zoneLabel}</td>
                  <td className={clsx("px-4 py-2.5 font-medium", sopSeverityStyle(resolution.sop.severity).text)}>
                    {resolution.sop.severity}
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">{resolution.sop.dispatch}</td>
                  <td className="px-4 py-2.5 text-slate-300">{resolution.sop.action}</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => toggleAcknowledged(resolution.id)}
                      className={clsx(
                        "flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors",
                        acknowledged
                          ? "bg-normal-muted text-normal"
                          : "bg-surface-raised text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <Check size={12} />
                      {acknowledged ? "Acknowledged" : "Acknowledge"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {resolutions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">
                  No dispatches yet. They&apos;ll show up here the moment a report comes in.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
