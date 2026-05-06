// Back-compat shim. Prefer `useResolvedImage` from `./useResolvedImage` for new code.
import { useResolvedImage } from "./useResolvedImage";

export function useWikipediaImage(input) {
  const queries = Array.isArray(input)
    ? input
    : input
    ? [input]
    : [];
  const { image_url, loading } = useResolvedImage({
    queries: queries.length ? queries : null,
  });
  return {
    src: image_url ?? null,
    loading,
    failed: !loading && !image_url,
  };
}
