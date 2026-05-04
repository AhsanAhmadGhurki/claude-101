import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { FeaturedDestinations } from "./FeaturedDestinations";
import { CTA } from "./CTA";

export function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <FeaturedDestinations />
      <CTA />
    </>
  );
}
