import { TickerClock } from "@/components/layout/TickerClock";
import { VenueTitle } from "@/components/layout/VenueTitle";

// --- TopBar: The Ticker --------------------------------------------------
// GANTRY's signature element — a broadcast-style status ticker instead of a
// generic dashboard header. Integration status pips are computed server-side
// from real env var presence (same pattern as app/settings/page.tsx), not
// the previous hardcoded-always-green "Telemetry Connected" indicator.
// Server component so these checks never leak into the client bundle; the
// venue name/switcher and the ticking clock are the only client pieces (see
// VenueTitle.tsx / TickerClock.tsx) since venue selection is client state.

function Pip({ label, live }: { label: string; live: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-broadcast" : "bg-slate-700"}`} />
      <span className="font-mono text-[11px] text-slate-500">{label}</span>
    </span>
  );
}

export function TopBar() {
  const integrations = [
    { label: "GROQ", live: Boolean(process.env.GROQ_API_KEY) },
    { label: "NWS", live: true }, // no key required
    { label: "OSM", live: true }, // no key required
    { label: "AIRNOW", live: Boolean(process.env.AIRNOW_API_KEY) },
  ];

  return (
    <header className="flex items-center justify-between border-b border-surface-border bg-surface-panel px-6 py-4">
      <VenueTitle />

      <div className="flex items-center gap-5 border-l border-surface-border pl-5">
        <div className="flex items-center gap-3">
          {integrations.map((integration) => (
            <Pip key={integration.label} label={integration.label} live={integration.live} />
          ))}
        </div>
        <TickerClock />
      </div>
    </header>
  );
}
