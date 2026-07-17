"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, HeartPulse, ShieldAlert, Wrench, CheckCircle2, Loader2 } from "lucide-react";
import clsx from "clsx";
import { getVenueById } from "@/lib/external/venues";
import { QUICK_REPORT_PRESETS } from "@/lib/quick-report-presets";
import { GantryMark } from "@/components/brand/GantryLogo";
import type { AnomalyResolution } from "@/lib/types";

const GATE_LABELS: Record<string, string> = {
  "gate-a": "North Gate",
  "gate-b": "South Gate",
  "gate-c": "East Gate",
  "gate-d": "West Gate",
};

const PRESET_ICONS: Record<string, typeof AlertTriangle> = {
  bottleneck: AlertTriangle,
  equipment: Wrench,
  medical: HeartPulse,
  security: ShieldAlert,
};

// --- Quick Report (public, no login) -----------------------------------------
// One tap, no typing — meant to be reached by scanning a printed QR code
// posted at a physical gate (see Settings for the per-gate QR codes). A
// steward standing at a gate on matchday has one hand on a scanner and no
// time to open the ops dashboard, sign in, and type a sentence into a chat
// widget. Deliberately outside the auth boundary (see middleware.ts) — this
// is a kiosk-style page, not part of the authenticated dashboard.
export default function QuickReportPage() {
  const params = useParams<{ venueId: string; gateId: string }>();
  const venue = getVenueById(params.venueId);
  const gateLabel = GATE_LABELS[params.gateId] ?? "Gate";
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [result, setResult] = useState<AnomalyResolution | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (presetId: string) => {
    setSubmittingId(presetId);
    setError(null);
    try {
      const response = await fetch("/api/quick-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: params.venueId, gateId: params.gateId, presetId }),
      });
      if (response.status === 429) {
        setError("Too many reports right now — wait a moment and try again.");
        return;
      }
      if (!response.ok) throw new Error("failed");
      const data: { resolution: AnomalyResolution } = await response.json();
      setResult(data.resolution);
    } catch {
      setError("Couldn't send that report. Check your connection and try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-normal-muted text-normal">
          <CheckCircle2 size={28} />
        </span>
        <div>
          <p className="font-display text-lg font-bold uppercase tracking-wide text-floodlight">Report sent</p>
          <p className="mt-1 text-sm text-slate-400">
            {result.sop.severity} response — {result.sop.dispatch}
          </p>
        </div>
        <button
          onClick={() => setResult(null)}
          className="mt-4 rounded-md border border-surface-border px-4 py-2 text-sm text-slate-300 hover:bg-surface-raised"
        >
          File another report
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-6 py-12">
      <GantryMark className="h-10 w-10" />
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-broadcast">{venue.name}</p>
        <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-wide text-floodlight">
          {gateLabel}
        </h1>
        <p className="mt-2 text-sm text-slate-500">Tap what you&apos;re seeing — this goes straight to ops.</p>
      </div>

      <div className="grid w-full max-w-sm grid-cols-1 gap-3 sm:grid-cols-2">
        {QUICK_REPORT_PRESETS.map((preset) => {
          const Icon = PRESET_ICONS[preset.id] ?? AlertTriangle;
          const isSubmitting = submittingId === preset.id;
          const isCritical = preset.severityHint === "critical";
          return (
            <button
              key={preset.id}
              onClick={() => submit(preset.id)}
              disabled={submittingId !== null}
              className={clsx(
                "flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-colors disabled:opacity-50",
                isCritical
                  ? "border-critical/40 bg-critical-muted hover:bg-critical/20"
                  : "border-warning/40 bg-warning-muted hover:bg-warning/20"
              )}
            >
              {isSubmitting ? (
                <Loader2 size={24} className="animate-spin text-slate-300" />
              ) : (
                <Icon size={24} className={isCritical ? "text-critical" : "text-warning"} />
              )}
              <span className="font-display text-sm font-bold uppercase tracking-wide text-floodlight">
                {preset.label}
              </span>
              <span className="text-[11px] text-slate-500">{preset.description}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}
    </div>
  );
}
