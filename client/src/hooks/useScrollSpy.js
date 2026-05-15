import { useEffect, useState } from "react";

// Track which section is currently in view. `ids` is the list of element ids
// to watch; the most-visible one wins, falling back to the first one above
// the viewport when nothing is intersecting (e.g. scrolled past the last).
//
// Single shared IntersectionObserver so adding or removing a day doesn't
// thrash multiple observers. Re-attaches when the ids list shape changes.

export function useScrollSpy(ids, { rootMargin = "-30% 0px -55% 0px" } = {}) {
  const [activeId, setActiveId] = useState(ids?.[0] ?? null);
  const [trackedKey, setTrackedKey] = useState(() => (ids ?? []).join("|"));

  const key = (ids ?? []).join("|");

  // Reset the active id when the watched set changes (e.g. a new trip with
  // a different number of days). Derived-state pattern avoids the setState-
  // in-effect anti-pattern.
  if (key !== trackedKey) {
    setTrackedKey(key);
    if (!ids?.includes(activeId)) setActiveId(ids?.[0] ?? null);
  }

  useEffect(() => {
    if (!ids || ids.length === 0) return undefined;

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (elements.length === 0) return undefined;

    const visibility = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.intersectionRatio);
        }
        let bestId = null;
        let bestRatio = 0;
        for (const [id, ratio] of visibility) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestRatio > 0 && bestId) setActiveId(bestId);
      },
      { rootMargin, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, rootMargin]);

  return activeId;
}
