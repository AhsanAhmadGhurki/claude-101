import { pickFallbackImage } from "../../utils/fallbackImage.js";

export function pickCuratedPhoto({ name, type, tags } = {}) {
  return pickFallbackImage(name, type, tags);
}
