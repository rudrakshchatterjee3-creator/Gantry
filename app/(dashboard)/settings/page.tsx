import { GATE_DENSITY_WARNING, GATE_DENSITY_CRITICAL } from "@/lib/mock-iot";
import { VENUE_CATALOG } from "@/lib/external/venues";
import { SelectedVenueSettingsRow } from "@/components/layout/SelectedVenueSettingsRow";
import { GateQrCodes } from "@/components/layout/GateQrCodes";

const CONFIG_GROUPS = [
  {
    title: "Thresholds",
    rows: [
      { label: "Ambient Gate Density — Warning", value: `${GATE_DENSITY_WARNING}%` },
      { label: "Ambient Gate Density — Critical", value: `${GATE_DENSITY_CRITICAL}%` },
      { label: "Incident Report Override TTL", value: "90 seconds" },
    ],
  },
  {
    title: "Gate Load Model",
    rows: [
      { label: "Source", value: "Modeled, not sensed — no public source publishes real occupancy data" },
      {
        label: "Inputs",
        value: "Real transit proximity (Overpass) + real local time-of-day + deterministic motion",
      },
      {
        label: "NJ Transit bus activity (MetLife)",
        value: process.env.TRANSITLAND_API_KEY
          ? "Live — Transitland, feed f-dr5-nj~transit~bus"
          : "Not configured (TRANSITLAND_API_KEY)",
      },
    ],
  },
  {
    title: "AI Orchestration",
    rows: [
      { label: "Input", value: "Free-text staff incident reports (no IoT sensors)" },
      { label: "Normalizer", value: "Mock keyword/zone matcher (lib/ai/normalizer.ts)" },
      { label: "Forecaster / Action Engine", value: "Groq — llama-3.3-70b-versatile" },
      { label: "Pipeline", value: "Normalizer → Forecaster → Action Engine" },
      { label: "Fallback", value: "Deterministic stub logic if the Groq call fails" },
    ],
  },
  {
    title: "Ask Gantry — Live External Data",
    rows: [
      { label: "OpenStreetMap Overpass", value: "Live — accessibility + transit POIs (no key needed)" },
      { label: "NOAA / NWS weather alerts", value: "Live — real severe weather alerts, US venues only (no key needed)" },
      {
        label: "US Census language demographics",
        value: process.env.CENSUS_API_KEY ? "Live — US venues only, table C16001" : "Not configured (CENSUS_API_KEY)",
      },
      {
        label: "EPA AirNow air quality",
        value: process.env.AIRNOW_API_KEY ? "Live — US venues only" : "Not configured (AIRNOW_API_KEY)",
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-lg font-bold uppercase tracking-wide text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500">System configuration and live data source status.</p>
      </div>

      <div className="rounded-lg border border-surface-border bg-surface-panel">
        <div className="border-b border-surface-border px-4 py-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
            Venue
          </h2>
        </div>
        <div className="divide-y divide-surface-border">
          <SelectedVenueSettingsRow />
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-slate-400">Host venues available</span>
            <span className="font-mono text-xs text-slate-200">{VENUE_CATALOG.length} of 16</span>
          </div>
        </div>
      </div>

      <GateQrCodes />

      {CONFIG_GROUPS.map((group) => (
        <div key={group.title} className="rounded-lg border border-surface-border bg-surface-panel">
          <div className="border-b border-surface-border px-4 py-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
              {group.title}
            </h2>
          </div>
          <div className="divide-y divide-surface-border">
            {group.rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-slate-400">{row.label}</span>
                <span className="font-mono text-xs text-slate-200">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
