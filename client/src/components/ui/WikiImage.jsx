import { useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useResolvedImage } from "../../hooks/useResolvedImage";
import { pickCategoryIcon } from "../../lib/utils/pickCategoryIcon";
import { pickFallbackImage } from "../../lib/utils/fallbackImage";
import { optimizeImageUrl, buildSrcSet } from "../../lib/utils/imageUrl";

export function WikiImage({
  query,
  queries,
  place,
  city,
  alt,
  label,
  category,
  categoryHint,
  width = 800,
  sizes,
  fetchPriority,
  className = "",
  imgClassName = "w-full h-full object-cover",
  loading = "lazy",
}) {
  const list = queries ?? (query ? [query] : []);

  const resolverInput = {
    place: place ?? null,
    city: city ?? null,
    queries: list.length ? list : null,
    category: category ?? categoryHint?.type ?? null,
    tags: categoryHint?.tags ?? null,
  };

  const { image_url, loading: fetching } = useResolvedImage(resolverInput);

  const placeholderLabel = label ?? alt ?? place ?? list[0] ?? "";
  const icon = pickCategoryIcon(
    placeholderLabel,
    categoryHint?.type ?? category,
    categoryHint?.tags
  );

  const curatedFallback = pickFallbackImage(
    placeholderLabel,
    categoryHint?.type ?? category,
    categoryHint?.tags
  );

  const candidates = [];
  if (image_url) candidates.push(image_url);
  if (curatedFallback && !candidates.includes(curatedFallback)) {
    candidates.push(curatedFallback);
  }

  const candidatesKey = candidates.join("|") || "_";
  const [errorIndex, setErrorIndex] = useState(0);
  const [prevKey, setPrevKey] = useState(candidatesKey);
  if (candidatesKey !== prevKey) {
    setPrevKey(candidatesKey);
    if (errorIndex !== 0) setErrorIndex(0);
  }

  const currentUrl = candidates[errorIndex] ?? null;
  const optimizedSrc = optimizeImageUrl(currentUrl, width);
  const srcSet = buildSrcSet(currentUrl);

  const showShimmer = fetching && !image_url;
  const showImg = !showShimmer && !!currentUrl;
  const showPlaceholder = !showShimmer && !currentUrl;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {showImg && (
        <img
          key={errorIndex}
          src={optimizedSrc}
          srcSet={srcSet ?? undefined}
          sizes={sizes}
          alt={alt ?? placeholderLabel}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          onError={() => setErrorIndex((i) => i + 1)}
          className={imgClassName}
        />
      )}

      {showShimmer && (
        <ImagePlaceholder label={placeholderLabel} icon={icon} shimmer />
      )}

      {showPlaceholder && (
        <ImagePlaceholder label={placeholderLabel} icon={icon} />
      )}
    </div>
  );
}

export function ImagePlaceholder({
  label,
  icon = "mdi:map-marker-radius",
  shimmer = false,
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/35 via-surface to-bg" />

      <motion.div
        animate={
          shimmer
            ? { opacity: [0.35, 0.7, 0.35] }
            : { opacity: [0.45, 0.6, 0.45] }
        }
        transition={{
          duration: shimmer ? 1.6 : 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 30%, rgb(var(--accent) / 0.45) 0%, transparent 45%), radial-gradient(circle at 75% 75%, rgb(var(--accent) / 0.25) 0%, transparent 50%), radial-gradient(circle at 60% 20%, rgba(255,255,255,0.08) 0%, transparent 35%)",
          filter: "blur(2px)",
        }}
      />

      <svg
        className="absolute inset-0 w-full h-full opacity-[0.10] mix-blend-screen pointer-events-none"
        aria-hidden
      >
        <defs>
          <pattern
            id="placeholder-topo"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 40 Q20 20 40 40 T80 40"
              stroke="white"
              strokeWidth="0.6"
              fill="none"
            />
            <path
              d="M0 60 Q20 40 40 60 T80 60"
              stroke="white"
              strokeWidth="0.4"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#placeholder-topo)" />
      </svg>

      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <motion.div
          animate={
            shimmer
              ? { scale: [0.95, 1.05, 0.95], opacity: [0.7, 1, 0.7] }
              : { scale: 1, opacity: 1 }
          }
          transition={{
            duration: 1.6,
            repeat: shimmer ? Infinity : 0,
            ease: "easeInOut",
          }}
          className="w-16 h-16 rounded-2xl bg-black/25 backdrop-blur-md flex items-center justify-center border border-white/15 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]"
        >
          <Icon icon={icon} className="text-3xl text-white/95" />
        </motion.div>
        {label && (
          <div className="max-w-full">
            <div className="text-sm sm:text-base font-bold tracking-wide text-white/95 leading-tight drop-shadow-sm line-clamp-2">
              {label}
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </div>
  );
}
