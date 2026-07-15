"use client";

import { useVenueStore } from "@/lib/store/useVenueStore";

export function SelectedVenueSettingsRow() {
  const venue = useVenueStore((state) => state.selectedVenue);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-slate-400">Selected venue</span>
      <span className="font-mono text-xs text-slate-200">
        {venue.name} — {venue.city}, {venue.region} ({venue.lat.toFixed(4)}, {venue.lon.toFixed(4)})
      </span>
    </div>
  );
}
