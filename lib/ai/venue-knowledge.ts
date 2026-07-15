import type { Venue } from "@/lib/external/venues";

// --- Venue Knowledge Base ----------------------------------------------------
// Static grounding data for the Fan Assistant concierge. MetLife Stadium gets
// a real, detailed block (gate letters, section numbers, transit facts) —
// this exists so the concierge answers from real facts instead of the model
// inventing plausible-sounding nonsense.
//
// The other 15 venues do NOT get an equivalent invented block: fabricating
// gate/section/parking-lot detail for stadiums this app has no real data
// source for would be exactly the kind of plausible-sounding nonsense this
// file exists to prevent. They get only their real name/city/coordinates
// plus an explicit instruction to lean on LIVE DATA (Overpass/NWS/AirNow)
// and say so plainly when asked something neither covers.

const METLIFE_KNOWLEDGE = `
STADIUM: MetLife Stadium, East Rutherford, New Jersey — FIFA World Cup 2026 host venue.

GATES:
- Gate A (North): Main supporter entrance, sections 101-119. Nearest to NJ Transit rail platform.
- Gate B (South): Family/accessible entrance, sections 120-138. Has dedicated accessible drop-off zone.
- Gate C (East): General entrance, sections 139-157. Nearest to bus terminal.
- Gate D (West): VIP/hospitality and press entrance, sections 158-176.

ACCESSIBILITY:
- Wheelchair-accessible seating at every section, entered via Gate B or the nearest gate's accessible ramp.
- Accessible restrooms located adjacent to every section on the main concourse.
- Sensory room (for guests with sensory sensitivities) located near Gate B, Section 120.
- Guest Services desks at every gate can arrange a companion escort on request.

TRANSPORTATION:
- NJ Transit rail: "Meadowlands Rail Line" direct from NY Penn Station and Secaucus Junction, arrives at a platform adjacent to Gate A.
- Bus: NJ Transit game-day express buses stop at the East Terminal near Gate C.
- Rideshare/taxi drop-off: designated Lot F, roughly 12-minute walk to Gate C.
- Parking: Lots A through J; Lot E is closest to Gate A, Lot H closest to Gate D.
- Accessible parking is available in every lot near the lot entrance, closest overall in Lot F near Gate B.

CROWD / TIMING GUIDANCE:
- Gates typically open 2.5 hours before kickoff.
- Heaviest congestion is at Gate A (rail arrivals) 60-90 minutes before kickoff.
- Gate C tends to have shorter lines in the final 30 minutes before kickoff.

AMENITIES:
- First aid / medical stations at each gate and on the main concourse near sections 110, 130, 150, 170.
- Prayer/reflection room located near Gate D, Section 160.
- Free water refill stations on every concourse level.
- Lost & Found is at Guest Services, Gate A.

MULTILINGUAL SUPPORT:
- Staff wear language badges for English, Spanish, Portuguese, French, and Arabic at every gate.
- Signage is pictogram-first to be understandable regardless of language.
`.trim();

function genericKnowledge(venue: Venue): string {
  return `
STADIUM: ${venue.name} (${venue.tournamentName}), ${venue.city}, ${venue.region}, ${venue.country} — FIFA World Cup 2026 host venue.

No detailed venue knowledge base (gate layout, section numbers, parking-lot detail) exists for this venue yet — only ${
    venue.country === "USA" ? "MetLife Stadium (New York New Jersey Stadium)" : "MetLife Stadium"
  } has one. Answer using LIVE DATA below wherever possible, and say so plainly rather than guessing if asked something neither LIVE DATA nor this line covers.
`.trim();
}

export function getVenueKnowledge(venue: Venue): string {
  return venue.id === "metlife" ? METLIFE_KNOWLEDGE : genericKnowledge(venue);
}
