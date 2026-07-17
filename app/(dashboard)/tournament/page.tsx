"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMemo } from "react";
import { Globe2, AlertTriangle, ArrowRight } from "lucide-react";
import clsx from "clsx";
import { VENUE_CATALOG, type Venue } from "@/lib/external/venues";
import { useVenueStore } from "@/lib/store/useVenueStore";
import { useStadiumStore } from "@/lib/store/useStadiumStore";
import { ZONE_SEVERITY_STYLES, THREAT_LEVEL_META } from "@/lib/ui/severity";
import type { SeverityLevel } from "@/lib/types";

// --- Tournament HQ ------------------------------------------------------------
// The one view built specifically for a FIFA tournament official rather than
// a single venue's staff — every other page in this app assumes you're
// watching one stadium. This shows all 16 host venues' current incident
// status side by side, sourced from useStadiumStore.resolutionsByVenue,
// which (unlike the old single shared array) persists every venue's
// incidents independently of which one is currently "selected" for the map
// and hero — switching to check on MetLife no longer erases what's
// happening at SoFi.
//
// Deliberately doesn't try to show live gate-density/occupancy for all 16
// venues simultaneously — that would require running the ambient telemetry
// ticker for venues nobody is looking at, which is unnecessary cost for a
// number nobody claims is a real sensor reading anyway (see
// lib/ui/gate-load-model.ts). What IS real and worth surfacing here: which
// venues have staff-flagged incidents right now, and how severe.

function worstSeverityForVenue(resolutions: { status: string; sop: { severity: string } }[]): SeverityLevel {
  const open = resolutions.filter((r) => r.status === "open");
  if (open.some((r) => r.sop.severity === "High")) return "critical";
  if (open.some((r) => r.sop.severity === "Medium")) return "warning";
  return "normal";
}

const COUNTRY_LABELS: Record<Venue["country"], string> = {
  USA: "United States",
  Mexico: "Mexico",
  Canada: "Canada",
};

export default function TournamentPage() {
  const router = useRouter();
  const setVenue = useVenueStore((state) => state.setVenue);
  const resolutionsByVenue = useStadiumStore((state) => state.resolutionsByVenue);

  const venuesByCountry = useMemo(() => {
    const groups = new Map<Venue["country"], Venue[]>();
    for (const venue of VENUE_CATALOG) {
      const list = groups.get(venue.country) ?? [];
      list.push(venue);
      groups.set(venue.country, list);
    }
    return groups;
  }, []);

  const totalOpenIncidents = useMemo(
    () =>
      Object.values(resolutionsByVenue).reduce(
        (sum, list) => sum + list.filter((r) => r.status === "open").length,
        0
      ),
    [resolutionsByVenue]
  );

  const venuesAtCritical = useMemo(
    () =>
      VENUE_CATALOG.filter(
        (v) => worstSeverityForVenue(resolutionsByVenue[v.id] ?? []) === "critical"
      ).length,
    [resolutionsByVenue]
  );

  const goToVenue = (venueId: string) => {
    setVenue(venueId);
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-wide text-slate-100">
            <Globe2 size={18} className="text-broadcast" />
            Tournament HQ
          </h1>
          <p className="text-sm text-slate-500">
            All 16 FIFA World Cup 2026 host venues — live incident status across the tournament.
          </p>
        </div>
        <div className="flex gap-4 rounded-lg border border-surface-border bg-surface-panel px-4 py-3">
          <div className="text-center">
            <p className="font-display text-xl font-bold text-slate-100">{totalOpenIncidents}</p>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Open Incidents</p>
          </div>
          <div className="w-px bg-surface-border" />
          <div className="text-center">
            <p className={clsx("font-display text-xl font-bold", venuesAtCritical > 0 ? "text-critical" : "text-normal")}>
              {venuesAtCritical}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Venues Critical</p>
          </div>
        </div>
      </div>

      {Array.from(venuesByCountry.entries()).map(([country, venues]) => (
        <div key={country}>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {COUNTRY_LABELS[country]}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {venues.map((venue) => {
              const resolutions = resolutionsByVenue[venue.id] ?? [];
              const openCount = resolutions.filter((r) => r.status === "open").length;
              const severity = worstSeverityForVenue(resolutions);
              const meta = THREAT_LEVEL_META[severity];
              const styles = ZONE_SEVERITY_STYLES[severity];
              const Icon = meta.icon;

              return (
                <button
                  key={venue.id}
                  onClick={() => goToVenue(venue.id)}
                  className={clsx(
                    "group flex flex-col overflow-hidden rounded-lg border bg-surface-panel text-left transition-colors hover:border-broadcast/40",
                    severity === "critical" ? "border-critical/40" : "border-surface-border"
                  )}
                >
                  <div className="relative h-24 shrink-0 overflow-hidden bg-surface-raised">
                    {venue.photoThumbUrl ? (
                      <Image
                        // A real ~330px Wikimedia-generated thumbnail, not
                        // the full-resolution hero photo — with 16 tiles on
                        // this page and next/image unable to resize itself
                        // on Cloudflare (see next.config.js), serving the
                        // full-size original here meant the browser had to
                        // decode a multi-hundred-KB/MB image just to show
                        // it at 96px, causing real scroll jank as each tile
                        // entered view.
                        src={venue.photoThumbUrl}
                        alt={venue.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-surface-raised to-surface text-[11px] text-slate-600">
                        No photo
                      </div>
                    )}
                    <div
                      className={clsx(
                        "absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        styles.badge
                      )}
                    >
                      <Icon size={10} />
                      {meta.label}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="font-display text-sm font-semibold text-slate-100">{venue.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {venue.city}, {venue.region}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={clsx(
                          "flex items-center gap-1 text-[11px] font-medium",
                          openCount > 0 ? "text-warning" : "text-slate-500"
                        )}
                      >
                        {openCount > 0 && <AlertTriangle size={11} />}
                        {openCount} open {openCount === 1 ? "incident" : "incidents"}
                      </span>
                      <span className="flex items-center gap-0.5 text-[11px] text-broadcast opacity-0 transition-opacity group-hover:opacity-100">
                        View <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
