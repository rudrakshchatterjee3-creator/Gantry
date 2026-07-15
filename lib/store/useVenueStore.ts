import { create } from "zustand";
import { DEFAULT_VENUE_ID, getVenueById, type Venue } from "@/lib/external/venues";

interface VenueStore {
  selectedVenueId: string;
  selectedVenue: Venue;
  setVenue: (venueId: string) => void;
}

// Which FIFA 2026 host venue the whole dashboard is currently showing.
// useStadiumStore's resolutions/zoneOverrides are keyed by venue id, so
// switching venues here doesn't destroy another venue's incident history —
// a FIFA official checking on MetLife and then SoFi should still see
// MetLife's incidents when they switch back.
export const useVenueStore = create<VenueStore>((set) => ({
  selectedVenueId: DEFAULT_VENUE_ID,
  selectedVenue: getVenueById(DEFAULT_VENUE_ID),

  setVenue: (venueId) => set({ selectedVenueId: venueId, selectedVenue: getVenueById(venueId) }),
}));
