import { pickFallbackImage } from "../../../../client/src/lib/utils/fallbackImage.js";

export function pickCuratedPhoto({ name, type, tags } = {}) {
  return pickFallbackImage(name, type, tags);
}
