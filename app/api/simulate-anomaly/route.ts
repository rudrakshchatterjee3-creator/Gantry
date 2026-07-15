import { NextRequest, NextResponse } from "next/server";
import { processAnomaly } from "@/lib/ai/orchestrator";
import { checkRateLimit } from "@/lib/external/rate-limiter";
import { auth } from "@/auth";

// --- Incident Report Ingestion -----------------------------------------------
// Backs components/reporting/IncidentReporter.tsx. Runs a staff-submitted,
// free-text incident report through the full layered AI pipeline
// (normalizer -> forecaster -> action-engine, live via Groq for the latter
// two) and returns the resulting AnomalyResolution. This is a real server
// route — rather than the client calling the AI layers directly — because
// the Forecaster/Action Engine hold a secret Groq API key that must never
// reach the browser bundle.
//
// Rate limited process-wide since this runs on a free-tier Groq key — see
// lib/external/rate-limiter.ts.

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isValidIncidentPayload(body: unknown): body is { text: string } {
  if (typeof body !== "object" || body === null) return false;
  const text = (body as Record<string, unknown>).text;
  return typeof text === "string" && text.trim().length > 0;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit("simulate-anomaly", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests — please wait a moment and try again." },
      { status: 429 }
    );
  }

  let text: string;

  try {
    const body = await request.json();
    if (!isValidIncidentPayload(body)) {
      throw new Error("Invalid incident report payload");
    }
    text = body.text.trim();
  } catch {
    return NextResponse.json(
      { error: "Invalid payload — expected { text: string }." },
      { status: 400 }
    );
  }

  const resolution = await processAnomaly(text);
  return NextResponse.json({ resolution });
}
