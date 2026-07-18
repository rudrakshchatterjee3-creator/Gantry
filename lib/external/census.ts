import { cached } from "@/lib/external/cache";
import type { Venue } from "@/lib/external/venues";
import { getEnvVar } from "@/lib/env";

// --- US Census Bureau ACS API -------------------------------------------------
// Real demographic data grounding for the multilingual feature: instead of
// guessing which languages matter near the venue, ask the actual Census
// language-spoken-at-home table (C16001) for the venue's county. As of 2024
// the Census Data API requires a free key (instant signup, no approval
// wait: https://api.census.gov/data/key_signup.html) — gated behind
// CENSUS_API_KEY, absent key means this client returns null and the
// concierge silently skips this context rather than failing. Only
// applicable to the 11 US venues — Mexico/Canada venues have no
// stateFips/countyFips and this returns null immediately for them, same as
// a missing key.

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — county demographics don't change daily

export interface LanguageDemographics {
  totalPopulation: number;
  spanish: number;
  frenchHaitianCajun: number;
  arabic: number;
  source: string;
}

/**
 * Real ACS 5-year language-spoken-at-home estimates for the venue's county.
 * Returns null if CENSUS_API_KEY is unset, the venue has no US county FIPS
 * (Mexico/Canada), or the request fails — callers must treat null as "no
 * data," not zero speakers.
 */
export async function getLanguageDemographics(venue: Venue): Promise<LanguageDemographics | null> {
  const apiKey = getEnvVar("CENSUS_API_KEY");
  if (!apiKey || !venue.stateFips || !venue.countyFips) return null;

  return cached(`census:language:${venue.id}`, CACHE_TTL_MS, async () => {
    try {
      const url =
        `https://api.census.gov/data/2022/acs/acs5?get=NAME,C16001_001E,C16001_003E,C16001_006E,C16001_033E` +
        `&for=county:${venue.countyFips}&in=state:${venue.stateFips}&key=${apiKey}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) return null;

      const rows: string[][] = await response.json();
      const [, dataRow] = rows; // row 0 is the header
      if (!dataRow) return null;

      return {
        totalPopulation: Number(dataRow[1]),
        spanish: Number(dataRow[2]),
        frenchHaitianCajun: Number(dataRow[3]),
        arabic: Number(dataRow[4]),
        source: `US Census Bureau ACS 5-Year Estimates, ${dataRow[0]} (table C16001)`,
      };
    } catch {
      return null;
    }
  });
}
