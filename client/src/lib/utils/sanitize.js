// Sanitisation + validation for user-typed text that flows into prompts,
// URLs, or storage. We never trust raw input — even though Gemini doesn't
// execute HTML, a free-text destination like `<script>...` would render
// as text everywhere it appears (page titles, share previews, exports) and
// looks unprofessional. Stripping it at the boundary keeps the entire app
// safe by construction.

// Strip any tag-like sequence ("<...>") and the most common injection
// scaffolding characters. Returns a trimmed clean string.
export function sanitizeText(value) {
  if (value == null) return "";
  const raw = String(value);
  return raw
    // Strip anything that looks like an HTML tag (greedy across attributes).
    .replace(/<[^>]*>/g, "")
    // Strip leftover angle brackets in case of partial tags ("<script") and
    // brace-style template injections that prompts might mis-handle.
    .replace(/[<>{}]/g, "")
    // Collapse runs of whitespace from the strip so "foo  bar" stays "foo bar".
    .replace(/\s{2,}/g, " ")
    .trim();
}

// True if the raw input contained anything we strip — used by validators
// that want to *reject* (not silently clean) suspicious payloads. We treat
// suspicious payloads as a UX moment: tell the user explicitly instead of
// silently mutating their input, since silent mutation makes "why is my
// destination wrong?" debugging miserable.
export function looksLikeInjection(value) {
  if (value == null) return false;
  const raw = String(value);
  if (/<[^>]*>/.test(raw)) return true;
  if (/[<>{}]/.test(raw)) return true;
  // javascript: / data: URIs and on*= event handlers as a belt-and-braces
  // check for prompts harvested from rich-text sources.
  if (/\b(?:javascript|data|vbscript):/i.test(raw)) return true;
  if (/\bon[a-z]+\s*=/i.test(raw)) return true;
  return false;
}

// Convenience: return null on safe input, an error message string on unsafe.
export function validateSafeText(value) {
  if (looksLikeInjection(value)) {
    return "Please enter a valid destination.";
  }
  return null;
}
