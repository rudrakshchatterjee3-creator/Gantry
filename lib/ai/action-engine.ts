import type { ImpactForecast, StandardOperatingProcedure } from "@/lib/types";
import { callGroqJSON } from "@/lib/ai/groq";

// --- AI Orchestration Layer 3: The Action Engine ----------------------------
// Responsibility: take the Forecaster's predicted impact and generate a
// concrete, actionable Standard Operating Procedure (SOP) for stadium staff.
//
// The third and final link in the layered-prompting chain. It only ever sees
// the forecast, never the raw sensor data — this keeps the prompt small,
// focused, and reusable across any anomaly type as long as it conforms to
// the ImpactForecast shape. Server-side only.

const ACTION_ENGINE_SYSTEM_PROMPT = `You are a stadium dispatcher AI.
You will receive a predicted impact forecast for an operational anomaly,
containing:
  - timeToCritical: how long until the situation becomes critical
  - impact: the predicted downstream consequence
  - confidence: forecast confidence, 0 to 1

Generate a 3-part action plan to mitigate this forecast:
  1. dispatch — which staff/unit to send and how many (e.g. "4 Stewards to
     Gate 4")
  2. action — the single most important physical mitigation step (e.g.
     "Open overflow lanes 7-9")
  3. severity — one of "Low", "Medium", "High" based on timeToCritical and
     confidence

Respond as strict JSON: { "dispatch": string, "action": string, "severity":
"Low" | "Medium" | "High" }. Be decisive — operations staff need a clear
instruction, not options.`;

const STUB_SOP_NO_OP: StandardOperatingProcedure = {
  dispatch: "No dispatch required",
  action: "Continue routine monitoring",
  severity: "Low",
};

const STUB_SOP_CRITICAL: StandardOperatingProcedure = {
  dispatch: "4 Stewards to Gate 4",
  action: "Open overflow lanes 7-9",
  severity: "High",
};

const VALID_SEVERITIES = new Set(["Low", "Medium", "High"]);

/**
 * Generates a Standard Operating Procedure via Groq, given the Forecaster's
 * output. Falls back to deterministic stub logic on any failure.
 */
export async function generateSOP(
  forecast: ImpactForecast | null | undefined
): Promise<StandardOperatingProcedure> {
  if (!forecast || forecast.timeToCritical === "N/A") return STUB_SOP_NO_OP;

  try {
    const result = await callGroqJSON<StandardOperatingProcedure>({
      system: ACTION_ENGINE_SYSTEM_PROMPT,
      user: JSON.stringify(forecast),
    });
    if (!result.dispatch || !result.action || !VALID_SEVERITIES.has(result.severity)) {
      throw new Error("Malformed Groq SOP response");
    }
    return result;
  } catch {
    return STUB_SOP_CRITICAL;
  }
}
