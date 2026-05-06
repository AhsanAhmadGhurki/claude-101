import { WikiImage } from "./WikiImage";

export function DestinationImage({
  destination,
  className,
  imgClassName,
  loading,
}) {
  const queries = [
    destination.wikipedia,
    destination.name,
    destination.region,
  ].filter(Boolean);
  return (
    <WikiImage
      place={destination.name}
      city={destination.region}
      queries={queries}
      alt={destination.name}
      label={destination.name}
      category={destination.category ?? destination.tag}
      categoryHint={{
        type: destination.category,
        tags: [destination.category, destination.tag].filter(Boolean),
      }}
      className={className}
      imgClassName={imgClassName}
      loading={loading}
    />
  );
}
