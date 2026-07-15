import { NextRequest, NextResponse } from "next/server";
import { getNearbyAccessibilityAndTransit } from "@/lib/external/overpass";
import { getTransitActivity } from "@/lib/external/transitland";
import { getVenueById } from "@/lib/external/venues";
import { auth } from "@/auth";

// --- Venue POIs Route ---------------------------------------------------
// Exposes real, live geodata to the client for VenueMap.tsx and the
// gate-load model (lib/ui/gate-load-model.ts): OpenStreetMap Overpass
// accessibility/transit/parking POIs, plus (MetLife only, when
// TRANSITLAND_API_KEY is set) real NJ Transit bus stop activity. Both
// clients are server-only (env vars, no CORS issue calling them here) and
// already cache per-venue internally — this route is a thin passthrough.

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const venueId = request.nextUrl.searchParams.get("venueId");
  const venue = getVenueById(venueId);
  const [pois, transitActivity] = await Promise.all([
    getNearbyAccessibilityAndTransit(venue),
    getTransitActivity(venue),
  ]);
  return NextResponse.json({ venue, pois, transitActivity });
}
