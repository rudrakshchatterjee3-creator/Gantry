# Prompt Engineering

GANTRY runs two separate LLM-driven systems, each with a deliberately different prompting strategy because they solve different problems. This document is the real design rationale behind both — every prompt quoted here is copied verbatim from the source file next to it, not paraphrased.

## 1. Layered prompting for incident dispatch

**Problem with a single prompt:** asking one LLM call to "parse this incident report, forecast its impact, and generate a dispatch plan" in one shot produces a prompt that's hard to test, hard to debug when it's wrong (which layer failed?), and impossible to improve incrementally — change the forecasting logic and you risk silently breaking the dispatch logic that was working fine.

**The fix:** three small, focused calls, each depending only on the previous layer's *output*, never its internals. `lib/ai/orchestrator.ts` chains them:

```
report text → Normalizer → Forecaster → Action Engine → SOP
```

### Layer 1 — Normalizer (`lib/ai/normalizer.ts`)

Intentionally **not** an LLM call. It's a keyword/zone matcher — real, working code, not a placeholder that silently does nothing. The file documents exactly why and exactly what the LLM seam would look like if swapped in later:

```
There are no physical IoT sensors feeding this system — every report is
unstructured text from a human. This is intentionally basic keyword/string
matching rather than a real NLU/LLM call, standing in for what a real
model would do.
```

This is a deliberate engineering call, not a shortcut hidden from the reader: a keyword matcher is deterministic, free, instant, and good enough to route a report to a zone/severity — spending an LLM call here would add latency and cost for a task that doesn't need semantic understanding at this layer.

### Layer 2 — Forecaster (`lib/ai/forecaster.ts`)

First real Groq call. System prompt, verbatim:

```
You are a predictive operational AI for a stadium command center.
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
"confidence": number }. Do not include any other commentary.
```

Design choices worth naming:
- **Receives text, not raw state.** The Forecaster never sees the original report or any internal zone IDs — only the Normalizer's `summary` string and `severity`. This is what makes the layer swappable: as long as whatever produces layer 2's input emits `{summary, severity}`, the Forecaster doesn't care how it was produced.
- **Forces a confidence score.** Every forecast carries a 0–1 confidence, consumed downstream by the Action Engine to help decide severity — an LLM that's allowed to say "I'm not sure" is more honest than one forced to sound certain every time.
- **`response_format: json_object` + low temperature (0.3).** Set once in `lib/ai/groq.ts`, applied to every layer — structured output mode plus low temperature trades creativity for consistency, correct for a system that needs a machine-parseable field every time, not once in a while.

### Layer 3 — Action Engine (`lib/ai/action-engine.ts`)

```
You are a stadium dispatcher AI.
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
instruction, not options.
```

The closing line — *"Be decisive — operations staff need a clear instruction, not options"* — exists because the first draft of this prompt produced hedged, multi-option responses ("you could either... or possibly...") that are useless to someone who needs to move in the next 30 seconds. Prompting for decisiveness explicitly, not just implicitly through role-play ("You are a dispatcher"), is what actually fixed it.

### Deterministic fallback, every layer

Every Groq-calling layer wraps its call in try/catch and falls back to a hardcoded, honest stub if the call fails for *any* reason — missing key, network error, malformed JSON, Groq downtime:

```ts
// forecaster.ts
} catch {
  return stubForecast(normalizedString);
}
```

The stub values aren't placeholder junk — `STUB_SOP_CRITICAL` still dispatches "4 Stewards to Gate 4" and opens overflow lanes, a real, sane default action. This means the dashboard is never one API outage away from being unusable, and a judge testing the app without a Groq key configured still sees a functioning (if less nuanced) system, not an error screen.

## 2. Constrained single-prompt for the fan concierge

The concierge (`lib/ai/concierge.ts`) is a different shape of problem — open-ended conversational Q&A doesn't decompose into clean sequential layers the way incident triage does, so it's one prompt, but heavily constrained rather than open-ended. The real system prompt (built dynamically per request):

```
You are a GenAI concierge assistant for fans, volunteers, and staff at a
FIFA World Cup 2026 stadium. You help with navigation, accessibility,
transportation, crowd/timing guidance, sustainability, and general venue
questions.

Answer using the VENUE KNOWLEDGE and LIVE DATA below — do not invent gate
numbers, locations, or schedules that aren't in them. Prefer LIVE DATA over
VENUE KNOWLEDGE when they overlap, since live data is more current. If asked
something neither section covers, say so plainly and suggest asking a Guest
Services desk at any gate.

Always reply in the SAME language the user asked their question in — detect
it yourself. Keep replies short (2-4 sentences), spoken-friendly (this reply
may be read aloud by text-to-speech), and concrete.

If — and only if — the user is REPORTING actual congestion, a long line, a
bottleneck, or a problem they are currently experiencing at a specific gate
or zone (not just asking "which gate should I use" or asking for directions),
also identify which zone they mean, mapped to one of exactly these IDs: [...]
This flags it for stadium staff to review — only set it when the user is
clearly describing a real, current condition, not a general question.
```

Three specific engineering decisions here, each solving a real failure mode observed while building this:

**"Do not invent gate numbers, locations, or schedules that aren't in them."** Without this line, the model would confidently answer questions about venues that have no detailed knowledge base (15 of 16 venues only have name/city/coordinates — see `lib/ai/venue-knowledge.ts`) by fabricating plausible-sounding gate letters and section numbers. The instruction is paired with an actual data gap disclosed in the same file: for non-MetLife venues, the knowledge string is `"no detailed venue knowledge base exists for this venue — answer only from LIVE DATA below, and say so plainly if asked something live data doesn't cover."` — the honesty constraint is enforced at both the prompt level and the data level, not just asked for and hoped.

**Multilingual by detection, not by translation pipeline.** `"Always reply in the SAME language the user asked their question in — detect it yourself."` No separate language-detection API call, no translation step — the LLM's own multilingual capability is used directly, which is both simpler and more accurate than a bolt-on detect→translate→respond pipeline, since it lets the model reason natively in the target language rather than translating an English answer after the fact.

**The congestion-detection field is the bidirectional-loop mechanism.** `congestionZoneId` isn't cosmetic — when set, `app/api/fan-assistant/route.ts` takes that output and feeds it into the *exact same* `processAnomaly()` pipeline described above, so a fan casually mentioning "the line at the north gate is insane" becomes a real, AI-forecasted, dispatched incident on the staff-facing Action Feed — without the fan ever knowing they filed a report. The prompt is explicit about the false-positive risk: `"only set it when the user is clearly describing a real, current condition, not a general question"` — tested directly (see `TESTING.md`) by confirming a plain "which gate should I use" question does *not* trigger a false incident.

## 3. Why Groq, and what "AI-generated" actually means here

Every Groq call in this codebase goes through one function, `callGroqJSON` (`lib/ai/groq.ts`) — a single choke point that: enforces `response_format: json_object` so downstream code never has to regex-parse a chat response, applies a 15-second timeout so a slow API call can't hang a request indefinitely, and throws on any failure so every caller is *forced* to have a fallback path rather than letting an unhandled promise rejection surface to the user. This is the one piece of infrastructure every layer above depends on, and it was written once, correctly, rather than reimplemented per-layer.
