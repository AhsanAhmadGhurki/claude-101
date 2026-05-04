import { useEffect, useState } from "react";

const cache = new Map();
const inflight = new Map();
const STORAGE_KEY = "wiki-image-cache-v1";

function loadCache() {
  if (cache.size > 0) return;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    Object.entries(stored).forEach(([k, v]) => cache.set(k, v));
  } catch {
    /* ignore */
  }
}

function persistCache() {
  try {
    const obj = {};
    cache.forEach((v, k) => {
      if (v) obj[k] = v;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

async function fetchWiki(title) {
  loadCache();
  if (cache.has(title)) return cache.get(title);
  if (inflight.has(title)) return inflight.get(title);

  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title.replace(/ /g, "_")
  )}`;

  const promise = fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const src =
        data?.originalimage?.source || data?.thumbnail?.source || null;
      cache.set(title, src);
      inflight.delete(title);
      persistCache();
      return src;
    })
    .catch(() => {
      cache.set(title, null);
      inflight.delete(title);
      return null;
    });

  inflight.set(title, promise);
  return promise;
}

export function useWikipediaImage(title, fallback) {
  loadCache();
  const [src, setSrc] = useState(() => cache.get(title) || fallback);

  useEffect(() => {
    let cancelled = false;
    fetchWiki(title).then((url) => {
      if (!cancelled && url) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [title]);

  return src;
}
