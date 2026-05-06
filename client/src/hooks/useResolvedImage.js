import { useEffect, useState } from "react";
import { peekCache, resolveImage } from "../services/image/resolve.js";

const EMPTY = { place_name: null, image_url: null, source: null, type: null };

export function useResolvedImage(input) {
  const key = JSON.stringify({
    place: input?.place ?? null,
    city: input?.city ?? null,
    queries: input?.queries ?? null,
    category: input?.category ?? null,
  });

  const [, tick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!input) return;
    const cached = peekCache(input);
    if (cached) return;
    resolveImage(input).then(() => {
      if (!cancelled) tick((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [key, input]);

  if (!input) return { ...EMPTY, loading: false };
  const cached = peekCache(input);
  if (cached) return { ...cached, loading: false };
  return { ...EMPTY, loading: true };
}
