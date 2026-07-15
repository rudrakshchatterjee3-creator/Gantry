// --- Gate Load Model ---------------------------------------------------------
// Replaces Math.random() gate-density generation with a deterministic model.
// No public source (free or paid) publishes real stadium turnstile/occupancy
// data — this does not exist anywhere. This is explicitly a MODEL, not a
// sensor reading, combining three real (non-random) inputs:
//
//   1. transitWeight (0-1): real transit-activity signal near this gate,
//      supplied by the caller — either live NJ Transit bus stop density from
//      Transitland (MetLife only, when TRANSITLAND_API_KEY is set) or live
//      OpenStreetMap Overpass transit/POI proximity (every venue, always
//      available). See lib/store/useAmbientTelemetry.ts for how this is
//      computed per gate.
//   2. Real current local time-of-day at the venue's own timezone — a
//      genuine live, non-random input driving a plausible matchday curve
//      (low overnight, rising through the afternoon, peaking evening).
//   3. Smooth deterministic motion via a sine wave of the real timestamp —
//      values visibly move between ticks without ever calling Math.random().
//
// Label this as a model everywhere it's surfaced (heatmap, map popups,
// Settings) — never imply it's a live occupancy sensor.

const BASE_MIN = 25;
const BASE_MAX = 92;
const MOTION_PERIOD_MS = 6 * 60 * 1000; // slow ~6 minute wave

function timeOfDayFactor(date: Date, timeZone: string): number {
  let hour: number;
  try {
    hour = Number(
      new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone }).format(date)
    );
  } catch {
    hour = date.getUTCHours();
  }
  if (!Number.isFinite(hour)) hour = date.getUTCHours();

  // Bell-shaped curve peaking at 19:00 local (typical evening kickoff),
  // near-zero around 4:00 local.
  const distanceFromPeak = Math.min(Math.abs(hour - 19), 24 - Math.abs(hour - 19));
  return Math.max(0, 1 - distanceFromPeak / 12);
}

function smoothMotion(timestamp: number, phaseOffset: number): number {
  return (Math.sin((timestamp / MOTION_PERIOD_MS) * 2 * Math.PI + phaseOffset) + 1) / 2; // 0-1
}

export interface GateLoadInput {
  transitWeight: number; // 0-1, precomputed by the caller
  timeZone: string;
  phaseOffset: number; // stagger each gate so they don't all move in lockstep
  now?: Date;
}

export function computeGateLoadPct({
  transitWeight,
  timeZone,
  phaseOffset,
  now = new Date(),
}: GateLoadInput): number {
  const timeFactor = timeOfDayFactor(now, timeZone);
  const motion = smoothMotion(now.getTime(), phaseOffset);

  const blended = 0.45 * clamp01(transitWeight) + 0.35 * timeFactor + 0.2 * motion;
  return Math.round(BASE_MIN + blended * (BASE_MAX - BASE_MIN));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
