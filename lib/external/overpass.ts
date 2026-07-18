import { cached } from "@/lib/external/cache";
import type { Venue } from "@/lib/external/venues";

// --- OpenStreetMap Overpass API -----------------------------------------------
// Free, no API key, real crowd-sourced geodata: wheelchair-accessible POIs
// and transit stops actually mapped near the venue.
//
// Two bugs found and fixed during testing:
//   1. The query only matched node[...], but most real-world POIs (parking
//      lots especially) are tagged as way[...] (polygons) in OSM — a query
//      restricted to nodes returns zero results even for a known-dense
//      reference point (verified against Times Square). Now queries both
//      node and way, with `out center` so ways return a usable coordinate.
//   2. overpass-api.de/lz4.overpass-api.de return HTTP 406 specifically to
//      Node's HTTP client (confirmed via both fetch and the raw https
//      module — a TLS/client-fingerprint block, not an IP issue) and
//      overpass.osm.ch returned 200 but empty even for dense reference
//      queries (a regional-only extract, not global data). Mirror rotation
//      now uses two mirrors verified to serve real global data to a Node
//      client: overpass.private.coffee and maps.mail.ru's Overpass proxy.
//
// Public Overpass mirrors are shared infrastructure with real rate limits —
// this client caches hard (1 hour; POI locations don't change minute to
// minute), retries once with a short backoff on 429/5xx before moving to
// the next mirror, and fails soft to [] so a flaky mirror never breaks the
// Fan Assistant.

const OVERPASS_MIRRORS = [
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — respect shared public infra
const BACKOFF_MS = 1500;

export interface NearbyPoi {
  name: string;
  category: string;
  distanceMeters: number;
  lat: number;
  lon: number;
}

interface OverpassElement {
  type: "node" | "way";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function coordsOf(element: OverpassElement): { lat: number; lon: number } | null {
  if (element.type === "node" && element.lat !== undefined && element.lon !== undefined) {
    return { lat: element.lat, lon: element.lon };
  }
  if (element.type === "way" && element.center) return element.center;
  return null;
}

function buildQuery(lat: number, lon: number): string {
  return `[out:json][timeout:20];
(
  node["wheelchair"="yes"](around:1200,${lat},${lon});
  way["wheelchair"="yes"](around:1200,${lat},${lon});
  node["railway"~"station|stop"](around:2000,${lat},${lon});
  node["public_transport"](around:2000,${lat},${lon});
  way["public_transport"](around:2000,${lat},${lon});
  node["amenity"="parking"](around:2000,${lat},${lon});
  way["amenity"="parking"](around:2000,${lat},${lon});
);
out center 40;`;
}

async function fetchMirror(mirror: string, query: string): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const response = await fetch(mirror, { method: "POST", body: query, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch {
    return null;
  }
}

async function queryMirrors(query: string): Promise<OverpassElement[]> {
  for (const mirror of OVERPASS_MIRRORS) {
    let response = await fetchMirror(mirror, query);

    // One short backoff-and-retry on rate limit / server overload before
    // giving up on this mirror and moving to the next.
    if (response && (response.status === 429 || response.status >= 500)) {
      await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS));
      response = await fetchMirror(mirror, query);
    }

    if (!response || !response.ok) continue;

    try {
      const data = (await response.json()) as { elements?: unknown[] };
      if (Array.isArray(data.elements)) return data.elements as OverpassElement[];
    } catch {
      continue;
    }
  }
  return [];
}

function labelFor(tags: Record<string, string>): string | null {
  if (tags.wheelchair === "yes") return `Accessible ${tags.amenity ?? tags.shop ?? "location"}`;
  if (tags.railway === "station" || tags.railway === "stop") return `Rail: ${tags.name ?? "unnamed station"}`;
  if (tags.public_transport) return `Transit: ${tags.name ?? "unnamed stop"}`;
  if (tags.amenity === "parking") return `Parking: ${tags.name ?? "unnamed lot"}`;
  return null;
}

/**
 * Real, live-queried accessible POIs and transit stops within ~2km of the
 * venue, sourced from OpenStreetMap contributor data. Returns [] if all
 * mirrors are unreachable/overloaded — callers must treat empty as "no data
 * right now," not "nothing exists nearby."
 */
export async function getNearbyAccessibilityAndTransit(venue: Venue): Promise<NearbyPoi[]> {
  return cached(`overpass:nearby:${venue.id}`, CACHE_TTL_MS, async () => {
    const elements = await queryMirrors(buildQuery(venue.lat, venue.lon));

    return elements
      .filter((element) => element.tags)
      .map((element) => {
        const label = labelFor(element.tags!);
        const coords = coordsOf(element);
        if (!label || !coords) return null;
        return {
          name: label,
          category: element.tags!.railway
            ? "transit"
            : element.tags!.amenity === "parking"
            ? "parking"
            : "accessibility",
          distanceMeters: Math.round(haversineMeters(venue.lat, venue.lon, coords.lat, coords.lon)),
          lat: coords.lat,
          lon: coords.lon,
        };
      })
      .filter((poi): poi is NearbyPoi => poi !== null)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 15);
  });
}
