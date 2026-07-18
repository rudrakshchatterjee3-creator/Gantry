import type { AnomalyResolution } from "@/lib/types";
import { normalizeIncidentReport } from "@/lib/ai/normalizer";
import { forecastImpact } from "@/lib/ai/forecaster";
import { generateSOP } from "@/lib/ai/action-engine";

// --- The Orchestrator --------------------------------------------------------
// Sequentially runs the three layered-prompting AI functions on a staff
// incident report:
//   report text -> normalizer -> forecaster -> action-engine -> SOP
//
// This is the "layered prompting" pattern: each layer is a small, focused
// function/LLM call rather than one prompt trying to parse + forecast +
// dispatch in a single shot. Each layer only depends on the previous layer's
// typed output, so any one layer can be swapped independently.
//
// Server-side only — the Forecaster and Action Engine make live Groq API
// calls using a secret key, so this chain must only ever be invoked from a
// Next.js Route Handler, never imported into a "use client" component.

export async function processAnomaly(reportText: string): Promise<AnomalyResolution> {
  const normalized = await normalizeIncidentReport(reportText);
  const forecast = await forecastImpact(normalized);
  const sop = await generateSOP(forecast);

  return {
    // crypto.randomUUID() over a module-level counter — Workers isolates
    // don't guarantee shared, atomically-incremented module state across
    // concurrent requests, so a counter risks colliding IDs under load.
    id: `resolution-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    reportText,
    normalized,
    forecast,
    sop,
    resolvedAt: new Date().toISOString(),
    status: "open",
    closedAt: null,
  };
}
