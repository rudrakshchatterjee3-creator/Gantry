import type { ConciergeReply, FanChatMessage, ZoneId } from "@/lib/types";

export interface ActiveIncidentSummary {
  zoneLabel: string;
  severity: string;
  action: string;
}
import { callGroqJSON } from "@/lib/ai/groq";
import { getVenueKnowledge } from "@/lib/ai/venue-knowledge";
import { buildLiveContext } from "@/lib/ai/live-context";
import { cached } from "@/lib/external/cache";
import type { Venue } from "@/lib/external/venues";

// --- Fan Assistant: GenAI Concierge ------------------------------------------
// Answers fan/staff questions about navigation, accessibility, transport,
// timing, and amenities — grounded in VENUE_KNOWLEDGE (static facts) plus
// buildLiveContext() (real, live external data: OSM accessibility/transit,
// NOAA weather alerts, Census language demographics, EPA air quality — each
// degrades independently if its source is unreachable/unconfigured).
// Replies in whatever language the question was asked in, which the caller
// (FanAssistant.tsx) uses to pick a browser TTS voice.
//
// The Groq call itself is cached (keyed by normalized question text, no
// conversation history — see CACHE_TTL_MS) so repeated identical questions,
// which is exactly what happens when multiple judges try the same obvious
// demo prompts, cost one Groq call instead of N. This runs on a free-tier
// key; see also lib/external/rate-limiter.ts, applied at the route level.

const ZONE_IDS = [
  "gate-a",
  "gate-b",
  "gate-c",
  "gate-d",
  "concourse-north",
  "concourse-south",
  "concourse-east",
  "concourse-west",
] as const;

function buildSystemPrompt(venueKnowledge: string, liveContext: string, activeIncidents: ActiveIncidentSummary[]): string {
  const incidentSection =
    activeIncidents.length > 0
      ? `\n\nACTIVE OPERATIONAL INCIDENTS (from stadium staff right now — this is more
current than anything else in this prompt, always mention it if the user
asks about a gate/zone it affects, and proactively steer them to a different
gate if theirs is impacted):\n${activeIncidents
          .map((i) => `- ${i.zoneLabel}: ${i.severity} severity — ${i.action}`)
          .join("\n")}`
      : "";

  return `You are a GenAI concierge assistant for fans, volunteers, and staff at a
FIFA World Cup 2026 stadium. You help with navigation, accessibility,
transportation, crowd/timing guidance, sustainability, and general venue
questions.

Answer using the VENUE KNOWLEDGE and LIVE DATA below — do not invent gate
numbers, locations, or schedules that aren't in them. Prefer LIVE DATA over
VENUE KNOWLEDGE when they overlap, since live data is more current. If asked
something neither section covers, say so plainly and suggest asking a Guest
Services desk at any gate.${incidentSection}

Always reply in the SAME language the user asked their question in — detect
it yourself. Keep replies short (2-4 sentences), spoken-friendly (this reply
may be read aloud by text-to-speech), and concrete.

If — and only if — the user is REPORTING actual congestion, a long line, a
bottleneck, or a problem they are currently experiencing at a specific gate
or zone (not just asking "which gate should I use" or asking for directions),
also identify which zone they mean, mapped to one of exactly these IDs:
gate-a (North Gate), gate-b (South Gate), gate-c (East Gate), gate-d (West
Gate), concourse-north, concourse-south, concourse-east, concourse-west. This
flags it for stadium staff to review — only set it when the user is clearly
describing a real, current condition, not a general question.

VENUE KNOWLEDGE:
${venueKnowledge}

${liveContext}

Respond as strict JSON: { "reply": string, "language": string (a short
BCP-47 language code like "en", "es", "pt", "fr", "ar"), "topics": string[]
(1-3 short tags for which knowledge areas you used, e.g. "accessibility",
"transport", "gates", "weather", "sustainability"), "congestionZoneId": one
of ${JSON.stringify(ZONE_IDS)} or null if the user was not reporting a real,
current congestion problem at a specific zone }.`;
}

const QUESTION_CACHE_TTL_MS = 3 * 60 * 1000;

const STUB_REPLY: ConciergeReply = {
  reply:
    "I'm having trouble reaching the assistant right now. Please ask any Guest Services desk at your nearest gate for help.",
  language: "en",
  topics: ["fallback"],
};

function buildUserContent(question: string, history: FanChatMessage[]): string {
  if (history.length === 0) return question;
  const recent = history.slice(-6); // keep the prompt small — last few turns of context
  const transcript = recent.map((m) => `${m.role}: ${m.text}`).join("\n");
  return `Conversation so far:\n${transcript}\n\nuser: ${question}`;
}

/**
 * Answers a fan/staff question via Groq, grounded in static venue knowledge
 * plus live external data. Falls back to a deterministic stub reply if the
 * Groq call fails (missing key, network error, malformed JSON) so the
 * widget never hard-fails — live-data fetch failures are already handled
 * independently inside buildLiveContext().
 */
export async function askConcierge(
  question: string,
  history: FanChatMessage[] = [],
  venue: Venue,
  activeIncidents: ActiveIncidentSummary[] = []
): Promise<ConciergeReply> {
  try {
    const liveContext = await buildLiveContext(venue);
    const venueKnowledge = getVenueKnowledge(venue);
    const callGroq = () =>
      callGroqJSON<ConciergeReply>({
        system: buildSystemPrompt(venueKnowledge, liveContext, activeIncidents),
        user: buildUserContent(question, history),
      });

    // Only cache fresh, no-history questions with no active incidents — an
    // active incident makes the correct answer time-sensitive (staff might
    // resolve it moments later), so it must always be answered live rather
    // than risk serving a stale cached reply that ignores a since-changed
    // situation. Cache key includes venue id so switching venues doesn't
    // serve a cached reply grounded in a different stadium.
    const result = (await (history.length === 0 && activeIncidents.length === 0
      ? cached(`concierge:${venue.id}:${question.trim().toLowerCase()}`, QUESTION_CACHE_TTL_MS, callGroq)
      : callGroq())) as ConciergeReply & { congestionZoneId?: ZoneId | null };

    if (!result.reply || !result.language) {
      throw new Error("Malformed Groq concierge response");
    }

    const congestionReport = result.congestionZoneId
      ? { zoneId: result.congestionZoneId, description: question }
      : null;

    return {
      reply: result.reply,
      language: result.language,
      topics: result.topics ?? [],
      congestionReport,
    };
  } catch {
    return STUB_REPLY;
  }
}
