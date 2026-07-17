import { NextRequest, NextResponse } from "next/server";
import { processAnomaly } from "@/lib/ai/orchestrator";
import { checkRateLimit } from "@/lib/external/rate-limiter";
import { getVenueById, VENUE_CATALOG } from "@/lib/external/venues";
import { getQuickReportPreset } from "@/lib/quick-report-presets";
import { pushQuickReport } from "@/lib/external/quick-report-store";
import type { ZoneId } from "@/lib/types";

// --- Quick Report Ingestion ---------------------------------------------------
// Backs the public /report/[venueId]/[gateId] page. Deliberately NOT behind
// session auth — a gate steward scanning a printed QR code on matchday
// won't be signed into the ops dashboard. Safe to leave public because the
// only accepted inputs are three closed enums (a real venue id, a real gate
// id, a known preset id) — there is no free-text field here, so this can't
// be used to inject arbitrary content into the LLM prompt the way an open
// text field could. Still rate-limited (tighter than the staff routes)
// since it's reachable without login.

const GATE_LABELS: Record<string, string> = {
  "gate-a": "North Gate",
  "gate-b": "South Gate",
  "gate-c": "East Gate",
  "gate-d": "West Gate",
};

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isValidPayload(body: unknown): body is { venueId: string; gateId: string; presetId: string } {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return typeof b.venueId === "string" && typeof b.gateId === "string" && typeof b.presetId === "string";
}

export async function POST(request: NextRequest) {
  if (!checkRateLimit("quick-report", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many reports — please wait a moment and try again." },
      { status: 429 }
    );
  }

  let venueId: string;
  let gateId: string;
  let presetId: string;

  try {
    const body = await request.json();
    if (!isValidPayload(body)) throw new Error("Invalid quick report payload");
    ({ venueId, gateId, presetId } = body);
  } catch {
    return NextResponse.json(
      { error: "Invalid payload — expected { venueId, gateId, presetId }." },
      { status: 400 }
    );
  }

  const venueExists = VENUE_CATALOG.some((v) => v.id === venueId);
  const gateLabel = GATE_LABELS[gateId];
  const preset = getQuickReportPreset(presetId);

  if (!venueExists || !gateLabel || !preset) {
    return NextResponse.json({ error: "Unknown venue, gate, or report type." }, { status: 400 });
  }

  const venue = getVenueById(venueId);
  const reportText = preset.reportTemplate(`${gateLabel}, ${venue.name}`);
  const resolution = await processAnomaly(reportText);
  pushQuickReport(venueId, resolution);

  return NextResponse.json({ resolution, venueId, gateId: gateId as ZoneId });
}
