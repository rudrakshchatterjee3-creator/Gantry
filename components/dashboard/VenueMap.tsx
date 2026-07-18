"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCurrentVenueOverrides } from "@/lib/store/useStadiumStore";
import { useAmbientTelemetry } from "@/lib/store/useAmbientTelemetry";
import { useVenueStore } from "@/lib/store/useVenueStore";
import { CHART_COLORS } from "@/lib/ui/chart-colors";
import { SECTOR_ZONE_MAP, classifyGateDensity } from "@/lib/ui/gate-sectors";
import type { SeverityLevel, ZoneId } from "@/lib/types";

// --- VenueMap: The Real Map ---------------------------------------------------
// An actual interactive map (MapLibre GL, free/no API key — CARTO's public
// dark basemap tiles) centered on whichever FIFA 2026 host venue is
// currently selected (useVenueStore). Plots two genuinely live things, not
// decoration:
//   1. The same 4 gate markers as StadiumGrid, colored by the same live
//      density/severity data (lib/store/useAmbientTelemetry + zoneOverrides).
//      Offsets are illustrative for every venue (no surveyed per-gate
//      coordinates exist publicly for any of the 16 stadiums).
//   2. Real nearby accessibility/transit/parking points fetched from
//      /api/venue-pois?venueId=..., backed by a live OpenStreetMap Overpass
//      query (lib/external/overpass.ts) — not hardcoded pins.

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; ' +
        '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: "carto-dark-layer", type: "raster", source: "carto-dark", minzoom: 0, maxzoom: 20 }],
};

const SEVERITY_HEX: Record<SeverityLevel, string> = {
  normal: CHART_COLORS.normal,
  warning: CHART_COLORS.warning,
  critical: CHART_COLORS.critical,
};

const POI_CATEGORY_HEX: Record<string, string> = {
  transit: CHART_COLORS.broadcast,
  parking: "#94a3b8",
  accessibility: CHART_COLORS.normal,
};

interface VenuePoi {
  name: string;
  category: string;
  distanceMeters: number;
  lat: number;
  lon: number;
}

function gateMarkerElement(color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "18px";
  el.style.height = "18px";
  el.style.borderRadius = "9999px";
  el.style.background = color;
  el.style.border = "2px solid rgba(10,14,18,0.9)";
  el.style.boxShadow = `0 0 0 4px ${color}33`;
  return el;
}

function poiMarkerElement(color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "9px";
  el.style.height = "9px";
  el.style.borderRadius = "9999px";
  el.style.background = color;
  el.style.border = "1.5px solid rgba(10,14,18,0.9)";
  return el;
}

export function VenueMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const gateMarkersRef = useRef<Map<ZoneId, maplibregl.Marker>>(new Map());
  const poiMarkersRef = useRef<maplibregl.Marker[]>([]);
  const venueMarkerRef = useRef<maplibregl.Marker | null>(null);
  const readings = useAmbientTelemetry((state) => state.readings);
  const zoneOverrides = useCurrentVenueOverrides();
  const venue = useVenueStore((state) => state.selectedVenue);

  // Initialize the map once.
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [venue.lon, venue.lat],
      zoom: 15.2,
      attributionControl: false,
      // Without this, MapLibre's default scrollZoom captures the mouse
      // wheel the instant the cursor passes over the map — the page scroll
      // stops dead and the map zooms instead. That reads exactly like
      // scroll lag/stutter to a user who wasn't trying to zoom the map at
      // all. cooperativeGestures requires Ctrl/Cmd+scroll to zoom (shows a
      // "use ctrl + scroll to zoom" hint on a plain scroll attempt instead),
      // the standard fix for a map embedded in a normally-scrolling page.
      cooperativeGestures: true,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Deliberately empty deps — the map instance is created once; recenter
    // and re-pin on venue change is handled by the effect below instead of
    // tearing down and rebuilding the whole MapLibre instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter, replace the venue marker, and reload POIs whenever the
  // selected venue changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.jumpTo({ center: [venue.lon, venue.lat], zoom: 15.2 });

    venueMarkerRef.current?.remove();
    venueMarkerRef.current = new maplibregl.Marker({ color: CHART_COLORS.broadcast })
      .setLngLat([venue.lon, venue.lat])
      .setPopup(new maplibregl.Popup({ offset: 16 }).setText(venue.name))
      .addTo(map);

    poiMarkersRef.current.forEach((marker) => marker.remove());
    poiMarkersRef.current = [];

    fetch(`/api/venue-pois?venueId=${venue.id}`)
      .then((res) => res.json() as Promise<{ pois: VenuePoi[] }>)
      .then((data) => {
        for (const poi of data.pois ?? []) {
          const color = POI_CATEGORY_HEX[poi.category] ?? "#94a3b8";
          const marker = new maplibregl.Marker({ element: poiMarkerElement(color) })
            .setLngLat([poi.lon, poi.lat])
            .setPopup(
              new maplibregl.Popup({ offset: 10 }).setText(`${poi.name} · ~${poi.distanceMeters}m`)
            )
            .addTo(map);
          poiMarkersRef.current.push(marker);
        }
      })
      .catch(() => {
        // Fails soft — the map still shows gates + venue marker without POIs.
      });
  }, [venue]);

  // Keep the 4 gate markers in sync with live density/severity, same source
  // of truth as StadiumGrid, and repositioned around whichever venue is
  // currently centered.
  //
  // Updates existing markers in place (position + color + popup text)
  // instead of destroying and recreating all 4 marker DOM elements on every
  // 4-second ambient telemetry tick — the previous remove-then-recreate
  // approach was real, avoidable DOM/layout churn running forever on any
  // page showing the map, and a likely contributor to the app feeling
  // sluggish.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const readingsByZone = new Map(readings.map((r) => [r.zoneId, r]));

    for (const { sector, zoneId, latOffset, lonOffset } of SECTOR_ZONE_MAP) {
      const reading = readingsByZone.get(zoneId);
      const override = zoneOverrides[zoneId];
      const overrideActive = Boolean(override && override.expiresAt > Date.now());
      const density = overrideActive ? override!.densityPct : reading?.gateDensityPct ?? 0;
      const level = overrideActive ? override!.severity : classifyGateDensity(density);
      const color = SEVERITY_HEX[level];
      const lngLat: [number, number] = [venue.lon + lonOffset, venue.lat + latOffset];
      const popupText = `${sector} Gate — ${density.toFixed(0)}% ${overrideActive ? "(reported)" : ""}`;

      const existing = gateMarkersRef.current.get(zoneId);
      if (existing) {
        existing.setLngLat(lngLat);
        const el = existing.getElement();
        el.style.background = color;
        el.style.boxShadow = `0 0 0 4px ${color}33`;
        existing.getPopup()?.setText(popupText);
      } else {
        const marker = new maplibregl.Marker({ element: gateMarkerElement(color) })
          .setLngLat(lngLat)
          .setPopup(new maplibregl.Popup({ offset: 14 }).setText(popupText))
          .addTo(map);
        gateMarkersRef.current.set(zoneId, marker);
      }
    }
  }, [readings, zoneOverrides, venue]);

  return (
    <div className="overflow-hidden rounded-lg border border-surface-border bg-surface-panel">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
          Venue Map
        </h2>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-broadcast" /> Transit
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-normal" /> Accessible
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Parking
          </span>
        </div>
      </div>
      <div ref={mapContainerRef} className="h-[360px] w-full" />
    </div>
  );
}
