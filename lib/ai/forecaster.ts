import type { NormalizedStatus, ImpactForecast } from "@/lib/types";
import { callGroqJSON } from "@/lib/ai/groq";

// --- AI Orchestration Layer 2: The Forecaster -------------------------------
// Responsibility: take the Normalizer's semantic status (extracted from a
// staff-submitted incident report) and predict near-future impact — how long
// until the situation becomes critical, and what the downstream consequence
// will be if nothing changes.
//
// A second, focused prompt in the layered chain. It receives text, not raw
// numbers — deliberately decoupled from the Normalizer's internals so either
// layer can be swapped/improved independently. Server-side only.

const FORECASTER_SYSTEM_PROMPT = `You are a predictive operational AI for a stadium command center.
You will receive a one-sentence operational status summarizing an incident
report submitted by stadium staff, along with its assessed severity.

Based on this status, predict:
  1. timeToCritical — an approximate ETA, as a short human-readable string
     (e.g. "12 mins"), until the situation would become unsafe if left
     unaddressed. Use "N/A" if the status does not indicate a worsening
     trend.
  2. impact — a short phrase describing the most likely downstream
     consequence (e.g. congestion spilling into an adjacent zone).
  3. confidence — your confidence in this forecast, from 0 to 1.

Respond as strict JSON: { "timeToCritical": string, "impact": string,
"confidence": number }. Do not include any other commentary.`;

const STUB_FORECAST_CRITICAL: ImpactForecast = {
  timeToCritical: "5 mins",
  impact: "Imminent crowd-crush risk — immediate crowd control required",
  confidence: 0.9,
};

const STUB_FORECAST_WARNING: ImpactForecast = {
  timeToCritical: "15 mins",
  impact: "Likely spillover into an adjacent zone if unresolved",
  confidence: 0.75,
};

const STUB_FORECAST_NORMAL: ImpactForecast = {
  timeToCritical: "N/A",
  impact: "No significant impact expected at current trend.",
  confidence: 0.4,
};

function stubForecast(normalizedString: NormalizedStatus): ImpactForecast {
  if (normalizedString.severity === "critical") return STUB_FORECAST_CRITICAL;
  if (normalizedString.severity === "warning") return STUB_FORECAST_WARNING;
  return STUB_FORECAST_NORMAL;
}

/**
 * Predicts near-future impact via Groq, given the Normalizer's output. Falls
 * back to deterministic stub logic on any failure (missing key, network
 * error, malformed JSON).
 */
export async function forecastImpact(
  normalizedString: NormalizedStatus | null | undefined
): Promise<ImpactForecast> {
  if (!normalizedString || !normalizedString.isElevated) return STUB_FORECAST_NORMAL;

  try {
    const result = await callGroqJSON<ImpactForecast>({
      system: FORECASTER_SYSTEM_PROMPT,
      user: JSON.stringify({
        summary: normalizedString.summary,
        severity: normalizedString.severity,
      }),
    });
    if (!result.timeToCritical || !result.impact || typeof result.confidence !== "number") {
      throw new Error("Malformed Groq forecast response");
    }
    return result;
  } catch {
    return stubForecast(normalizedString);
  }
}
