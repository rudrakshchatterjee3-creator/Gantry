"use client";

import { ChevronDown } from "lucide-react";
import { VENUE_CATALOG } from "@/lib/external/venues";
import { useVenueStore } from "@/lib/store/useVenueStore";

const COUNTRIES = ["USA", "Mexico", "Canada"] as const;

// Plain native <select> — no dropdown/combobox library exists anywhere in
// this app yet, and a native select is the simplest correct choice here:
// accessible, keyboard/mobile-friendly, zero added dependency.
export function VenueSwitcher() {
  const selectedVenueId = useVenueStore((state) => state.selectedVenueId);
  const setVenue = useVenueStore((state) => state.setVenue);

  return (
    <div className="relative">
      <select
        aria-label="Select venue"
        value={selectedVenueId}
        onChange={(event) => setVenue(event.target.value)}
        className="appearance-none rounded-md border border-surface-border bg-surface-raised py-1.5 pl-3 pr-7 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-broadcast"
      >
        {COUNTRIES.map((country) => (
          <optgroup key={country} label={country}>
            {VENUE_CATALOG.filter((v) => v.country === country).map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name} — {venue.city}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}
