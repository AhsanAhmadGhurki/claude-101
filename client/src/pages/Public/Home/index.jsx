import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { FeaturedDestinations } from "./FeaturedDestinations";
import { Testimonials } from "./Testimonials";
import { CTA } from "./CTA";
import { usePageTitle } from "../../../hooks/usePageTitle";

export function HomePage() {
  // No label → restores the default marketing title.
  usePageTitle();
  return (
    <>
      <Hero />
      <HowItWorks />
      <FeaturedDestinations />
      <Testimonials />
      <CTA />
    </>
  );
}
