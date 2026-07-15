// Shared domain types for GANTRY. Kept centralized so the mock layer, the AI
// orchestration layers, and the future live n8n/LLM integration can share
// the same contracts without churn.

export type ZoneId =
  | "gate-a"
  | "gate-b"
  | "gate-c"
  | "gate-d"
  | "concourse-north"
  | "concourse-south"
  | "concourse-east"
  | "concourse-west";

export type SeverityLevel = "normal" | "warning" | "critical";

export interface ZoneTelemetry {
  zoneId: ZoneId;
  zoneName: string;
  timestamp: string; // ISO 8601
  gateDensityPct: number; // 0-100, % of max safe occupancy
  turnstileThroughput: number; // people/min
  concourseTrafficPct: number; // 0-100, % of max flow capacity
  severity: SeverityLevel;
}

// --- Layered AI Orchestration Pipeline (Natural-Language Incident Reports) --
// There are no physical IoT sensors in this system. The pipeline is driven
// by free-text incident reports typed by stadium staff (see
// components/reporting/IncidentReporter.tsx), e.g. "Huge bottleneck forming
// at the North Gate due to a broken scanner". This raw string is the input
// to lib/ai/normalizer.ts.

// Output of lib/ai/normalizer.ts — the structured extraction of a raw
// incident report: which zone it concerns (if any could be identified), how
// severe it is, and a semantic summary for downstream layers/UI.
export interface NormalizedStatus {
  zoneId: ZoneId | null; // null if no zone could be confidently extracted
  zoneLabel: string;
  summary: string; // one-sentence operational status
  severity: SeverityLevel;
  isElevated: boolean; // severity !== "normal" — kept for the Forecaster's trend check
}

// Output of lib/ai/forecaster.ts
export interface ImpactForecast {
  timeToCritical: string; // human-readable ETA, e.g. "12 mins"
  impact: string; // predicted downstream consequence
  confidence: number; // 0-1
}

// Output of lib/ai/action-engine.ts
export interface StandardOperatingProcedure {
  dispatch: string; // staffing/unit dispatch instruction
  action: string; // physical mitigation action
  severity: SeverityLevel | "High" | "Medium" | "Low";
}

// Output of lib/ai/orchestrator.ts — the full trace through all three layers,
// stored in the Zustand store so the UI can render provenance, not just the
// final SOP.
export interface AnomalyResolution {
  id: string;
  reportText: string; // the original staff-submitted incident report
  normalized: NormalizedStatus;
  forecast: ImpactForecast;
  sop: StandardOperatingProcedure;
  resolvedAt: string; // when the AI pipeline produced this SOP, NOT when staff resolved the incident
  status: "open" | "resolved"; // staff-controlled: set via useStadiumStore.resolveAnomaly
  closedAt: string | null; // when staff marked it resolved, null while open
}

// --- Fan Assistant (GenAI concierge) -----------------------------------------
// Fan-facing chat: navigation, accessibility, transport, multilingual Q&A.
// Answered by lib/ai/concierge.ts, grounded in lib/ai/venue-knowledge.ts.
export interface FanChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  language: string; // BCP-47 tag detected/used for this turn, e.g. "en", "pt", "es"
  createdAt: string;
  topics?: string[]; // live data sources used for this reply, e.g. "weather", "accessibility"
}

export interface ConciergeReply {
  reply: string;
  language: string; // language the reply is written in — drives TTS voice selection
  topics: string[]; // which knowledge-base topics were used, for transparency in UI
  // Set when the concierge detects the user is reporting real congestion at a
  // specific gate/zone (not just asking for directions) — the fan-assistant
  // route uses this to run the same incident pipeline staff reports use, so
  // a fan's live report actually reaches the Action Feed a venue manager
  // watches, instead of being advice that only the fan ever sees.
  congestionReport?: {
    zoneId: ZoneId;
    description: string;
  } | null;
}
