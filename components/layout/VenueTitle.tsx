"use client";

import { useVenueStore } from "@/lib/store/useVenueStore";
import { VenueSwitcher } from "@/components/layout/VenueSwitcher";

export function VenueTitle() {
  const venue = useVenueStore((state) => state.selectedVenue);

  return (
    <div className="flex items-center gap-4">
      <div>
        <h1 className="font-display text-base font-bold uppercase tracking-wide text-slate-100">
          {venue.name} — Matchday Operations
        </h1>
        <p className="text-xs text-slate-500">
          {venue.tournamentName} &middot; FIFA World Cup 2026 &middot; {venue.city}, {venue.region}
        </p>
      </div>
      <VenueSwitcher />
    </div>
  );
}
