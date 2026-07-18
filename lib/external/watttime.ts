import { cached } from "@/lib/external/cache";
import { getEnvVar } from "@/lib/env";

// --- WattTime Grid Carbon Intensity API --------------------------------------
// Real electricity grid carbon-intensity data for the sustainability
// category. CAVEAT: free WattTime accounts are approved for exactly one
// balancing-authority region at signup, and this account's token is scoped
// to CAISO_NORTH (California) — not PJM, the actual grid serving MetLife
// Stadium in New Jersey. Rather than silently mislabel California grid data
// as the venue's own, this is surfaced honestly: a real, live, correctly
// sourced grid-carbon reading for a real US region, explicitly NOT claimed
// to be the venue's local grid. Swap WATTTIME_REGION once a PJM-scoped
// account/region is available.

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min — WattTime signal-index updates frequently, but free tier should be conservative

export interface GridCarbonReading {
  region: string;
  isVenueRegion: boolean;
  percentile: number | null; // 0-100, where this moment ranks vs. typical carbon intensity for the region
  fetchedAt: string;
}

async function login(): Promise<string | null> {
  const username = getEnvVar("WATTTIME_USERNAME");
  const password = getEnvVar("WATTTIME_PASSWORD");
  if (!username || !password) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch("https://api.watttime.org/login", {
      headers: { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;

    const data = (await response.json()) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Real, live grid carbon-intensity percentile for the configured WattTime
 * region (see CAVEAT above re: region mismatch with the venue). Returns
 * null if credentials are missing or the API call fails.
 */
export async function getGridCarbonReading(): Promise<GridCarbonReading | null> {
  const region = getEnvVar("WATTTIME_REGION") ?? "CAISO_NORTH";
  return cached("watttime:signal-index", CACHE_TTL_MS, async () => {
    const token = await login();
    if (!token) return null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(
        `https://api.watttime.org/v3/signal-index?region=${region}&signal_type=co2_moer`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      clearTimeout(timeout);
      if (!response.ok) return null;

      const data = (await response.json()) as { data?: { value?: number }[] };
      const percentile = data?.data?.[0]?.value ?? null;

      return {
        region,
        // Derived, not hardcoded — true once WATTTIME_REGION is set to PJM
        // (MetLife Stadium's actual grid), not just when using the default
        // CAISO_NORTH (California) scoped to this project's free account.
        isVenueRegion: region === "PJM",
        percentile,
        fetchedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  });
}
