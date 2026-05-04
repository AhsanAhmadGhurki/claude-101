import { useWikipediaImage } from "../../hooks/useWikipediaImage";

export function DestinationImage({ destination, className, loading }) {
  const src = useWikipediaImage(
    destination.wikipedia || destination.name,
    destination.img
  );
  return (
    <img
      src={src}
      alt={destination.name}
      loading={loading}
      className={className}
    />
  );
}
