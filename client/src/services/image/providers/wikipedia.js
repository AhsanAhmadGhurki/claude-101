const cache = new Map();
const inflight = new Map();

export async function fetchWikipediaPhoto(title) {
  if (!title || typeof title !== "string") return null;
  if (cache.has(title)) return cache.get(title);
  if (inflight.has(title)) return inflight.get(title);

  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title.replace(/ /g, "_")
  )}`;

  const promise = fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .then(
      (data) =>
        data?.thumbnail?.source || data?.originalimage?.source || null
    )
    .catch(() => null)
    .then((result) => {
      cache.set(title, result);
      inflight.delete(title);
      return result;
    });

  inflight.set(title, promise);
  return promise;
}
