// --- Groq LLM Client ---------------------------------------------------------
// Thin wrapper around Groq's OpenAI-compatible chat completions API. This
// module must only ever be imported from server-side code (API route
// handlers, or lib/ai/*.ts files that are themselves only called from
// route handlers) — GROQ_API_KEY is a server-only env var and will be
// `undefined` if this ever ends up in a client bundle, which is the
// intended fail-safe rather than leaking the key to the browser.

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT_MS = 15_000;

interface GroqJSONCallParams {
  system: string;
  user: string;
}

/**
 * Calls Groq's chat completions endpoint in JSON mode and parses the
 * response content as T. Throws on any failure (missing key, network error,
 * non-2xx response, malformed JSON) — callers are expected to catch and
 * fall back to deterministic stub logic so the dashboard stays usable
 * even without a configured key or if Groq is unreachable.
 */
export async function callGroqJSON<T>({ system, user }: GroqJSONCallParams): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Groq API returned no content");
    }

    return JSON.parse(content) as T;
  } finally {
    clearTimeout(timeout);
  }
}
