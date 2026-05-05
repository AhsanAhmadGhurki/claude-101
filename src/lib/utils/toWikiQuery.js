const LEAD_VERBS =
  /^(drive|walk|hike|trek|tour|visit|ride|stroll|see|explore|cross|crossing|climb|swim|sail)\b/i;
const LEAD_CONNECTORS =
  /^(through|to|around|across|on|the|via|at|past|over|along|in|into|from|toward|towards)\b/i;
const TRAILING_DESCRIPTORS =
  /\s+(walk|tour|hike|trek|visit|stroll|drive|ride|expedition|crossing|climb|day-?\s*hike|day-?trip|tasting|breakfast|lunch|dinner|trail|browsing|stop|picnic|sunset|sunrise|ceremony|trip|view|viewpoint|exterior view|with permit|shopping|jeep ride|boat ride|tour|getaway)\s*$/i;

export function toWikiQuery(spotName) {
  if (!spotName) return null;
  let q = String(spotName);

  q = q.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  q = q.replace(/\s+[-—–]\s+.*$/, "").trim();

  let before;
  do {
    before = q;
    q = q.replace(LEAD_VERBS, "").trim();
    q = q.replace(LEAD_CONNECTORS, "").trim();
  } while (q !== before);

  let prev;
  do {
    prev = q;
    q = q.replace(TRAILING_DESCRIPTORS, "").trim();
  } while (q !== prev);

  q = q.replace(/\s{2,}/g, " ").trim();
  return q || null;
}
