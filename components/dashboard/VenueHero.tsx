"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useVenueStore } from "@/lib/store/useVenueStore";
import { useAmbientTelemetry } from "@/lib/store/useAmbientTelemetry";
import { useCurrentVenueResolutions } from "@/lib/store/useStadiumStore";
import { ZONE_SEVERITY_STYLES } from "@/lib/ui/severity";
import type { SeverityLevel } from "@/lib/types";

// Real photos of the actual venues (not stock/generic stadium images) —
// Wikimedia Commons, individually curl-verified during implementation, one
// per venue (see lib/external/venues.ts). A venue without a verified photo
// gets photoUrl: null and falls back to a text-only banner rather than a
// guessed/broken image URL.
//
// The overlay strip is live, not decorative: worst-case severity and active
// alert count come from the same stores AIActionFeed/StadiumGrid read, and
// local time is computed from the venue's real IANA timezone — this banner
// reflects current ops state, it isn't just a caption under a photo.

function worstSeverity(severities: SeverityLevel[]): SeverityLevel {
  if (severities.includes("critical")) return "critical";
  if (severities.includes("warning")) return "warning";
  return "normal";
}

export function VenueHero() {
  const venue = useVenueStore((state) => state.selectedVenue);
  const readings = useAmbientTelemetry((state) => state.readings);
  const resolutions = useCurrentVenueResolutions();
  const [localTime, setLocalTime] = useState("");

  useEffect(() => {
    const update = () =>
      setLocalTime(
        new Intl.DateTimeFormat("en-US", {
          timeZone: venue.timeZone,
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date())
      );
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [venue.timeZone]);

  const severity = worstSeverity(readings.map((r) => r.severity));
  const activeAlerts = resolutions.filter((r) => r.status === "open").length;

  return (
    <div className="relative h-48 shrink-0 overflow-hidden rounded-lg border border-surface-border sm:h-56">
      {venue.photoUrl ? (
        <>
          <Image
            key={venue.id}
            src={venue.photoUrl}
            alt={`${venue.name} exterior, ${venue.city}`}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 66vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(10,14,18,0.95) 0%, rgba(10,14,18,0.35) 45%, rgba(10,14,18,0) 100%)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-surface-raised to-surface" />
      )}

      <div className="absolute right-0 top-0 flex items-center gap-3 rounded-bl-lg border-b border-l border-surface-border bg-surface/80 px-3 py-1.5 backdrop-blur-sm">
        <span className={`flex items-center gap-1.5 text-xs font-semibold ${ZONE_SEVERITY_STYLES[severity].text}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {severity === "normal" ? "Nominal" : severity === "warning" ? "Elevated" : "Critical"}
        </span>
        <span className="text-xs text-slate-400">
          {activeAlerts} active {activeAlerts === 1 ? "alert" : "alerts"}
        </span>
        <span className="font-mono text-xs text-slate-400">{localTime} local</span>
      </div>

      <div className="absolute bottom-0 left-0 p-4">
        <p className="font-display text-xl font-bold uppercase tracking-wide text-white drop-shadow">
          {venue.name}
        </p>
        <p className="text-xs text-slate-300 drop-shadow">
          {venue.city}, {venue.region}
        </p>
      </div>

      {venue.photoUrl && venue.photoAttributionUrl && (
        <a
          href={venue.photoAttributionUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-1 right-2 text-[10px] text-slate-400 hover:text-slate-200"
        >
          Photo: Wikimedia Commons
        </a>
      )}
    </div>
  );
}
