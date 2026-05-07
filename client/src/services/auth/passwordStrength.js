// Lightweight strength scorer — kept dependency-free (zxcvbn is ~700KB).
// Returns { score: 0..4, label, color, percent } so the UI can render
// a progress bar + label without making its own decisions.

export function scorePassword(password) {
  if (!password) return { score: 0, label: "", color: "transparent", percent: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Penalize obvious weak patterns even if the rules above were satisfied.
  // Two tiers:
  //   1) Exact-ish match (the password IS a weak word, with maybe a few
  //      trailing digits/symbols on a short composition) → cap at "Weak".
  //   2) Weak word as a substring of a longer composition that adds real
  //      entropy (e.g. "Password123!") → soft penalty of one notch so the
  //      remaining strength signal still shows.
  const weak = ["password", "12345", "qwerty", "letmein", "iloveyou", "admin"];
  const lower = password.toLowerCase();
  const stripped = lower.replace(/[^a-z]+$/, "");
  const isExactWeak =
    weak.includes(lower) || (weak.includes(stripped) && password.length <= 10);
  if (isExactWeak) {
    score = Math.min(score, 1);
  } else if (weak.some((w) => lower.includes(w))) {
    score = Math.max(0, score - 1);
  }
  if (/^(.)\1+$/.test(password)) score = 0;

  // Squash to 0..4
  score = Math.min(4, score);

  const meta = [
    { label: "Too weak", color: "#ef4444", percent: 12 },
    { label: "Weak", color: "#f59e0b", percent: 30 },
    { label: "Fair", color: "#eab308", percent: 55 },
    { label: "Good", color: "#22c55e", percent: 80 },
    { label: "Strong", color: "#16a34a", percent: 100 },
  ];
  return { score, ...meta[score] };
}
