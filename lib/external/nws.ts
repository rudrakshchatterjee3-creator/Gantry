import { cached } from "@/lib/external/cache";
import type { Venue } from "@/lib/external/venues";

// --- NOAA / National Weather Service API -------------------------------------
// Free, no API key — official US government severe weather alerts. NWS
// policy requires a descriptive User-Agent identifying the app (not a key,
// just courtesy). Cached 10 minutes: alerts don't need per-question freshness
// and this is shared public infrastructure.

const NWS_USER_AGENT = "ISC-FanAssistant (FIFA World Cup 2026 hackathon demo)";
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface WeatherAlert {
  event: string;
  headline: string;
  severity: string;
}

/**
 * Real active NWS severe weather alerts for the venue's coordinates. NWS
 * only covers the US — non-US venues (Mexico/Canada) will simply get []
 * from a non-ok response here, same as any other unreachable-source case.
 * Returns [] if the API is unreachable or there are simply no active
 * alerts — both cases mean "nothing to report," which is the correct thing
 * to tell a fan.
 */
export async function getActiveWeatherAlerts(venue: Venue): Promise<WeatherAlert[]> {
  return cached(`nws:alerts:${venue.id}`, CACHE_TTL_MS, async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(
        `https://api.weather.gov/alerts/active?point=${venue.lat},${venue.lon}`,
        { headers: { "User-Agent": NWS_USER_AGENT }, signal: controller.signal }
      );
      clearTimeout(timeout);
      if (!response.ok) return [];

      const data = await response.json();
      const features = Array.isArray(data.features) ? data.features : [];

      return features.map((feature: { properties: Record<string, string> }) => ({
        event: feature.properties.event,
        headline: feature.properties.headline,
        severity: feature.properties.severity,
      }));
    } catch {
      return [];
    }
  });
}
