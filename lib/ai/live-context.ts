import { getNearbyAccessibilityAndTransit } from "@/lib/external/overpass";
import { getActiveWeatherAlerts } from "@/lib/external/nws";
import { getLanguageDemographics } from "@/lib/external/census";
import { getAirQuality } from "@/lib/external/airnow";
import type { Venue } from "@/lib/external/venues";

// --- Live Context Assembler ---------------------------------------------------
// Pulls real, live data from every configured external source for the
// selected venue and renders it as a text block the concierge appends to its
// system prompt alongside the static/generic VENUE KNOWLEDGE. Every source
// degrades independently and silently (empty array / null) if its API is
// unreachable, its key isn't configured, or (for Census/NWS/AirNow) the
// venue is outside the US — a missing/failed source just means less
// context, never a broken response.
//
// WattTime (lib/external/watttime.ts) is intentionally NOT called here: the
// available free-tier account is scoped to CAISO_NORTH (California), not
// any of the 16 venues' actual grids, and showing California grid-carbon
// data labeled as a stadium sustainability metric would be misleading even
// with a caveat. The client stays in the codebase for when a properly
// region-scoped account is available.
//
// The sustainability angle instead combines two things already fetched
// above for other purposes, rather than a new fabricated venue-specific
// metric: the REAL count of transit stops OSM has mapped within 2km of
// this exact venue (from the same Overpass query accessibility/parking
// already comes from), plus a general, publicly cited emissions-per-mile
// comparison (EPA "Greenhouse Gas Emissions from a Typical Passenger
// Vehicle," FTA public transit emissions research) — explicitly a general
// reference fact, not a live per-venue carbon reading, so it can't mislead
// the way an out-of-region WattTime number would.
const TRANSIT_EMISSIONS_NOTE =
  "General reference (EPA/FTA): a typical passenger vehicle emits roughly 400g CO2 per mile driven alone; " +
  "public transit trips typically produce meaningfully less CO2 per passenger-mile. Not a live venue-specific measurement.";

function buildSustainabilitySection(nearby: { category: string }[]): string | null {
  const transitCount = nearby.filter((poi) => poi.category === "transit").length;
  if (transitCount === 0) return null;

  return (
    `SUSTAINABILITY (real transit density near this venue, OpenStreetMap):\n` +
    `- ${transitCount} transit stop${transitCount === 1 ? "" : "s"} mapped within 2km of the venue\n` +
    `- ${TRANSIT_EMISSIONS_NOTE}\n` +
    `- If a fan asks about reducing their footprint getting to the game, suggest transit using the real nearby stops above, not a made-up number.`
  );
}

export async function buildLiveContext(venue: Venue): Promise<string> {
  const [nearby, alerts, language, airQuality] = await Promise.all([
    getNearbyAccessibilityAndTransit(venue),
    getActiveWeatherAlerts(venue),
    getLanguageDemographics(venue),
    getAirQuality(venue),
  ]);

  const sections: string[] = [];

  if (nearby.length > 0) {
    const lines = nearby
      .slice(0, 8)
      .map((poi) => `- ${poi.name} (${poi.category}, ~${poi.distanceMeters}m from venue)`)
      .join("\n");
    sections.push(`LIVE NEARBY DATA (OpenStreetMap, real mapped locations):\n${lines}`);
  }

  if (alerts.length > 0) {
    const lines = alerts.map((alert) => `- ${alert.event} (${alert.severity}): ${alert.headline}`).join("\n");
    sections.push(`LIVE WEATHER ALERTS (NOAA/National Weather Service):\n${lines}`);
  }

  if (language) {
    sections.push(
      `LIVE LANGUAGE DEMOGRAPHICS (${language.source}):\n` +
        `- Spanish speakers: ~${language.spanish.toLocaleString()}\n` +
        `- French/Haitian/Cajun speakers: ~${language.frenchHaitianCajun.toLocaleString()}\n` +
        `- Arabic speakers: ~${language.arabic.toLocaleString()}\n` +
        `- County population: ~${language.totalPopulation.toLocaleString()}`
    );
  }

  if (airQuality.length > 0) {
    const lines = airQuality.map((reading) => `- ${reading.parameter}: AQI ${reading.aqi} (${reading.category})`).join("\n");
    sections.push(`LIVE AIR QUALITY (EPA AirNow, near venue):\n${lines}`);
  }

  const sustainability = buildSustainabilitySection(nearby);
  if (sustainability) sections.push(sustainability);

  if (sections.length === 0) {
    return "No live external data sources are currently available — answer using VENUE KNOWLEDGE only.";
  }

  return sections.join("\n\n");
}
