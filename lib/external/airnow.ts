import { cached } from "@/lib/external/cache";
import type { Venue } from "@/lib/external/venues";

// --- EPA AirNow API -----------------------------------------------------------
// Real, live US government air quality data for the venue's coordinates —
// sustainability/health angle. Free key, instant approval at
// https://docs.airnowapi.org/. Gated behind AIRNOW_API_KEY; returns null if
// unset so the concierge silently skips this context rather than failing.

const CACHE_TTL_MS = 30 * 60 * 1000; // AirNow observations update roughly hourly

export interface AirQualityReading {
  parameter: string; // e.g. "PM2.5", "OZONE"
  aqi: number;
  category: string; // e.g. "Good", "Moderate", "Unhealthy for Sensitive Groups"
}

/**
 * Real current air quality readings near the venue. AirNow only covers the
 * US — non-US venues will simply get [] from an empty/non-ok response.
 * Returns [] if AIRNOW_API_KEY is unset or the request fails.
 */
export async function getAirQuality(venue: Venue): Promise<AirQualityReading[]> {
  const apiKey = process.env.AIRNOW_API_KEY;
  if (!apiKey) return [];

  return cached(`airnow:current:${venue.id}`, CACHE_TTL_MS, async () => {
    try {
      const url =
        `https://www.airnowapi.org/aq/observation/latLong/current/` +
        `?format=application/json&latitude=${venue.lat}&longitude=${venue.lon}` +
        `&distance=25&API_KEY=${apiKey}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) return [];

      const data = await response.json();
      if (!Array.isArray(data)) return [];

      return data.map((reading: { ParameterName: string; AQI: number; Category: { Name: string } }) => ({
        parameter: reading.ParameterName,
        aqi: reading.AQI,
        category: reading.Category?.Name ?? "Unknown",
      }));
    } catch {
      return [];
    }
  });
}
