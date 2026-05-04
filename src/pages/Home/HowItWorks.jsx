import { useRef } from "react";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DestinationImage } from "../../components/ui/DestinationImage";
import { DESTINATIONS } from "../../data/destinations";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SKARDU = DESTINATIONS.find((d) => d.id === "skardu");

const STEPS = [
  {
    num: "01",
    icon: "mdi:lightbulb-on-outline",
    title: "Whisper your dream",
    text: "A destination, a vibe, or a sentence. AI reads between the lines.",
  },
  {
    num: "02",
    icon: "mdi:robot-happy-outline",
    title: "Get a real itinerary",
    text: "Day-wise plans, packing lists, safety tips — tailored to you.",
  },
  {
    num: "03",
    icon: "mdi:map-search-outline",
    title: "Refine, save, go",
    text: "Tweak any day, save it for later, share it with your crew.",
  },
];

export function HowItWorks() {
  const root = useRef(null);

  useGSAP(
    () => {
      const tag = root.current.querySelector(".js-tag");
      const heading = root.current.querySelector(".js-heading");
      const para = root.current.querySelector(".js-para");
      const featured = root.current.querySelector(".js-featured");
      const cards = root.current.querySelectorAll(".js-step");

      gsap.from([tag, heading, para], {
        opacity: 0,
        y: 24,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: tag,
          start: "top 85%",
          once: true,
        },
      });

      if (featured) {
        gsap.from(featured, {
          opacity: 0,
          y: 40,
          scale: 0.96,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featured,
            start: "top 85%",
            once: true,
          },
        });
      }

      gsap.from(cards, {
        opacity: 0,
        y: 50,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: cards[0],
          start: "top 85%",
          once: true,
        },
      });

      cards.forEach((card) => {
        const onEnter = () => gsap.to(card, { y: -4, duration: 0.3, ease: "power2.out" });
        const onLeave = () => gsap.to(card, { y: 0, duration: 0.3, ease: "power2.out" });
        card.addEventListener("mouseenter", onEnter);
        card.addEventListener("mouseleave", onLeave);
        card.__cleanup = () => {
          card.removeEventListener("mouseenter", onEnter);
          card.removeEventListener("mouseleave", onLeave);
        };
      });

      return () => {
        cards.forEach((card) => card.__cleanup?.());
      };
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative px-6 py-28 sm:py-32">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
        <div className="lg:sticky lg:top-32">
          <span className="js-tag inline-block text-xs font-bold uppercase tracking-[0.3em] text-accent">
            The Journey
          </span>
          <h2 className="js-heading mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold text-fg leading-tight tracking-tight">
            From a thought
            <br />
            to a trail.
          </h2>
          <p className="js-para mt-5 text-fg-muted text-lg max-w-md leading-relaxed">
            Three steps. No spreadsheets, no endless tabs, no decision fatigue.
          </p>

          <div className="js-featured hidden lg:block mt-10 relative w-full aspect-[5/4] rounded-3xl overflow-hidden border border-line surface-shadow">
            <DestinationImage
              destination={SKARDU}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-white/80 mb-1">
                Most planned this month
              </p>
              <h3 className="text-2xl font-bold">Skardu Valley</h3>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="js-step group relative p-7 sm:p-8 rounded-3xl bg-surface border border-line hover:border-line-strong surface-shadow transition-colors overflow-hidden"
            >
              <span
                aria-hidden
                className="absolute -right-3 -top-6 text-[9rem] font-bold text-fg/[0.04] leading-none pointer-events-none select-none"
              >
                {step.num}
              </span>

              <div className="relative flex items-start gap-5">
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-accent-fg transition">
                  <Icon icon={step.icon} className="text-2xl" />
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-fg-subtle mb-2">
                    STEP {step.num}
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-fg leading-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-fg-muted leading-relaxed">
                    {step.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
