const WIKIMEDIA_THUMB_WIDTH_RE = /\/(\d+)px-([^/?#]+)$/;

export function isWikimedia(url) {
  return typeof url === "string" && /wikimedia\.org|wikipedia\.org/.test(url);
}

export function isUnsplash(url) {
  return typeof url === "string" && /images\.unsplash\.com/.test(url);
}

export function rewriteWikiWidth(url, width) {
  if (!url || !width) return url;
  if (!WIKIMEDIA_THUMB_WIDTH_RE.test(url)) return url;
  return url.replace(WIKIMEDIA_THUMB_WIDTH_RE, `/${Math.round(width)}px-$2`);
}

export function rewriteUnsplashUrl(url, width) {
  if (!url || !isUnsplash(url)) return url;
  const u = new URL(url);
  if (!u.searchParams.has("auto")) u.searchParams.set("auto", "format");
  if (width) u.searchParams.set("w", String(Math.round(width)));
  if (!u.searchParams.has("q")) u.searchParams.set("q", "75");
  return u.toString();
}

export function optimizeImageUrl(url, width) {
  if (!url) return url;
  if (isWikimedia(url)) return rewriteWikiWidth(url, width);
  if (isUnsplash(url)) return rewriteUnsplashUrl(url, width);
  return url;
}

export function buildSrcSet(url, widths = [400, 800, 1200, 1600]) {
  if (!url) return null;
  if (!isWikimedia(url) && !isUnsplash(url)) return null;
  if (isWikimedia(url) && !WIKIMEDIA_THUMB_WIDTH_RE.test(url)) return null;
  return widths
    .map((w) => `${optimizeImageUrl(url, w)} ${w}w`)
    .join(", ");
}
