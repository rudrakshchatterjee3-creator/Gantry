import { NextRequest, NextResponse } from "next/server";
import type { FanChatMessage } from "@/lib/types";
import { askConcierge, type ActiveIncidentSummary } from "@/lib/ai/concierge";
import { processAnomaly } from "@/lib/ai/orchestrator";
import { checkRateLimit } from "@/lib/external/rate-limiter";
import { getVenueById } from "@/lib/external/venues";
import { auth } from "@/auth";

// --- Fan Assistant Chat Route -------------------------------------------------
// Backs components/assistant/FanAssistant.tsx. Runs a fan/staff question
// through the Groq-backed concierge, grounded in venue knowledge. Server
// route (not called from the client AI layer directly) because
// askConcierge -> callGroqJSON holds a secret Groq API key.
//
// Rate limited process-wide (not per-user) since this runs on a free-tier
// Groq key — caps total chat volume well below Groq's own limit so a burst
// of demo traffic degrades to a friendly 429 instead of a hard failure.

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isValidPayload(
  body: unknown
): body is {
  question: string;
  history?: FanChatMessage[];
  venueId?: string;
  activeIncidents?: ActiveIncidentSummary[];
} {
  if (typeof body !== "object" || body === null) return false;
  const question = (body as Record<string, unknown>).question;
  return typeof question === "string" && question.trim().length > 0;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit("fan-assistant", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests — please wait a moment and try again." },
      { status: 429 }
    );
  }

  let question: string;
  let history: FanChatMessage[];
  let venueId: string | undefined;
  let activeIncidents: ActiveIncidentSummary[];

  try {
    const body = await request.json();
    if (!isValidPayload(body)) throw new Error("Invalid fan assistant payload");
    question = body.question.trim();
    history = Array.isArray(body.history) ? body.history : [];
    venueId = body.venueId;
    activeIncidents = Array.isArray(body.activeIncidents) ? body.activeIncidents : [];
  } catch {
    return NextResponse.json(
      { error: "Invalid payload — expected { question: string, history?: FanChatMessage[] }." },
      { status: 400 }
    );
  }

  const venue = getVenueById(venueId);
  const reply = await askConcierge(question, history, venue, activeIncidents);

  // A fan/staff congestion report reaches the exact same incident pipeline
  // staff use via the Incident Reporter — so it lands in the Action Feed a
  // venue manager actually watches, not just as advice back to the asker.
  let resolution = null;
  if (reply.congestionReport) {
    const reportText = `Fan Assistant report — ${reply.congestionReport.zoneId}: "${reply.congestionReport.description}"`;
    resolution = await processAnomaly(reportText);
  }

  return NextResponse.json({ reply, resolution });
}
