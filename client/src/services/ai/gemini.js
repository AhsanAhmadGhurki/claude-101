// Low-level Gemini REST client.
//
// Uses the Generative Language API's `generateContent` endpoint with
// JSON-mode (`responseMimeType: "application/json"`) so the model is forced to
// emit a single valid JSON document — no markdown fences, no commentary.
//
// We keep the wire layer dumb on purpose: it just sends prompts and returns
// raw text. Higher layers (prompts.js, parser.js) own the schema.

// `gemini-flash-latest` is the canonical "Gemini Flash" alias — Google
// rolls it forward to whichever flash model is current, so we don't need
// to pin a version. If the model is rate-limited we fall back to the lite
// variant in generateTripPlan.
const DEFAULT_MODEL = "gemini-flash-latest";

function readEnv(name, fallback = "") {
  // Vite inlines import.meta.env at build time. Reading via optional-chain
  // keeps tests that stub import.meta from blowing up.
  return import.meta.env?.[name] ?? fallback;
}

export class GeminiError extends Error {
  constructor(message, { status, code, cause } = {}) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
    this.code = code;
    this.cause = cause;
  }
}

export function getApiKey() {
  return readEnv("VITE_GEMINI_API_KEY", "").trim();
}

export function isConfigured() {
  return Boolean(getApiKey());
}

function endpointFor(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;
}

/**
 * Call Gemini once and return the raw text response.
 * Throws GeminiError on any failure (network, auth, server, blocked content).
 */
export async function callGemini({
  systemInstruction,
  prompt,
  model = readEnv("VITE_GEMINI_MODEL", DEFAULT_MODEL),
  temperature = 0.85,
  topP = 0.95,
  maxOutputTokens = 8192,
  signal,
} = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new GeminiError(
      "Gemini API key is missing. Set VITE_GEMINI_API_KEY in client/.env.local.",
      { code: "MISSING_API_KEY" }
    );
  }
  if (!prompt) {
    throw new GeminiError("Prompt is required.", { code: "EMPTY_PROMPT" });
  }

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      topP,
      maxOutputTokens,
      responseMimeType: "application/json",
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  let res;
  try {
    res = await fetch(`${endpointFor(model)}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (cause) {
    if (cause?.name === "AbortError") throw cause;
    throw new GeminiError(
      "Couldn't reach Gemini. Check your network connection.",
      { code: "NETWORK", cause }
    );
  }

  const rawText = await res.text();
  let data;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    // Non-JSON response is almost always an HTML error page from a proxy.
    throw new GeminiError("Gemini returned an unexpected response.", {
      status: res.status,
      code: "BAD_GATEWAY",
    });
  }

  if (!res.ok) {
    const status = data?.error?.status;
    let code = status || "HTTP_ERROR";
    // Treat overload (503 / UNAVAILABLE) the same as 429 / RESOURCE_EXHAUSTED:
    // both are transient capacity errors that should silently fall over to
    // the lite model rather than bubbling up to the user.
    if (
      res.status === 429 ||
      res.status === 503 ||
      status === "RESOURCE_EXHAUSTED" ||
      status === "UNAVAILABLE"
    ) {
      code = "RATE_LIMIT";
    }
    if (res.status === 401 || res.status === 403) code = "AUTH";
    const message =
      data?.error?.message ||
      `Gemini request failed (HTTP ${res.status}).`;
    throw new GeminiError(message, { status: res.status, code });
  }

  const candidate = data?.candidates?.[0];
  // Safety filters can return a response with no parts. Surface that
  // distinctly so callers can suggest the user soften the prompt.
  if (!candidate || candidate.finishReason === "SAFETY") {
    throw new GeminiError(
      "Gemini declined to answer this prompt. Try rephrasing.",
      { code: "SAFETY" }
    );
  }
  const text = candidate?.content?.parts
    ?.map((p) => p?.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new GeminiError("Gemini returned an empty response.", {
      code: "EMPTY_RESPONSE",
    });
  }

  return text;
}
