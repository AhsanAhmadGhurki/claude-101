import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { FeaturedDestinations } from "./FeaturedDestinations";
import { Testimonials } from "./Testimonials";
import { CTA } from "./CTA";

export function HomePage() {
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
