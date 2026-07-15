import type { NormalizedStatus, ZoneId, SeverityLevel } from "@/lib/types";

// --- AI Orchestration Layer 1: The Normalizer -------------------------------
// Responsibility: parse a free-text incident report typed by stadium staff
// into a structured, semantic status — which zone it concerns, how severe it
// is, and a one-sentence summary the next layer can act on.
//
// >>> MOCKED AI PARSING <<<
// There are no physical IoT sensors feeding this system — every report is
// unstructured text from a human. This is intentionally basic keyword/string
// matching rather than a real NLU/LLM call, standing in for what a real
// model would do. It has the obvious limitations of a keyword matcher (no
// negation handling — "no issues at the North Gate" still matches "North" —
// no multi-zone reports, no synonym coverage beyond the tables below). The
// seam to replace this with a real Groq call (see lib/ai/groq.ts, already
// used by the Forecaster and Action Engine) is:
//
//   const result = await callGroqJSON<{ zoneId: ZoneId | null; severity: SeverityLevel; summary: string }>({
//     system: "You are an incident triage assistant for a stadium command
//       center. Extract which zone (if any) and how severe a staff-submitted
//       incident report is, and write a one-sentence operational summary.",
//     user: reportText,
//   });

const ZONE_KEYWORDS: { zoneId: ZoneId; zoneLabel: string; keywords: string[] }[] = [
  { zoneId: "gate-a", zoneLabel: "North Gate", keywords: ["north gate", "gate a", "north"] },
  { zoneId: "gate-b", zoneLabel: "South Gate", keywords: ["south gate", "gate b", "south"] },
  { zoneId: "gate-c", zoneLabel: "East Gate", keywords: ["east gate", "gate c", "east"] },
  { zoneId: "gate-d", zoneLabel: "West Gate", keywords: ["west gate", "gate d", "west"] },
  { zoneId: "concourse-north", zoneLabel: "Concourse North", keywords: ["concourse north", "north concourse"] },
  { zoneId: "concourse-south", zoneLabel: "Concourse South", keywords: ["concourse south", "south concourse"] },
  { zoneId: "concourse-east", zoneLabel: "Concourse East", keywords: ["concourse east", "east concourse"] },
  { zoneId: "concourse-west", zoneLabel: "Concourse West", keywords: ["concourse west", "west concourse"] },
];

const CRITICAL_KEYWORDS = [
  "huge",
  "severe",
  "critical",
  "major",
  "broken",
  "collapse",
  "surge",
  "crush",
  "medical",
  "fire",
  "evacuat",
  "blocked",
  "closed",
  "stampede",
  "emergency",
  "trapped",
];

const WARNING_KEYWORDS = [
  "bottleneck",
  "slow",
  "delay",
  "backup",
  "crowded",
  "busy",
  "queue",
  "long line",
  "congest",
  "malfunction",
];

function resolveZone(lowerText: string): { zoneId: ZoneId | null; zoneLabel: string } {
  for (const zone of ZONE_KEYWORDS) {
    if (zone.keywords.some((keyword) => lowerText.includes(keyword))) {
      return { zoneId: zone.zoneId, zoneLabel: zone.zoneLabel };
    }
  }
  return { zoneId: null, zoneLabel: "Unspecified Zone" };
}

function resolveSeverity(lowerText: string): SeverityLevel {
  if (CRITICAL_KEYWORDS.some((keyword) => lowerText.includes(keyword))) return "critical";
  if (WARNING_KEYWORDS.some((keyword) => lowerText.includes(keyword))) return "warning";
  // Any report a staff member bothers to submit is treated as at least
  // worth a look — this is a deliberate simplification of the mock parser.
  return "warning";
}

/**
 * Mock AI parsing stub: extracts a zone and severity from a free-text
 * incident report via keyword matching. See the MOCKED AI PARSING note
 * above for the real-LLM seam this stands in for.
 */
export async function normalizeIncidentReport(reportText: string): Promise<NormalizedStatus> {
  const trimmed = reportText.trim();
  const lowerText = trimmed.toLowerCase();
  const { zoneId, zoneLabel } = resolveZone(lowerText);
  const severity = resolveSeverity(lowerText);

  const summary = zoneId
    ? `Staff report — ${zoneLabel}: "${trimmed}"`
    : `Staff report (zone unspecified): "${trimmed}"`;

  return {
    zoneId,
    zoneLabel,
    summary,
    severity,
    isElevated: severity !== "normal",
  };
}
