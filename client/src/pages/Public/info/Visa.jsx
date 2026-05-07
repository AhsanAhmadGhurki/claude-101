import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { InfoLayout, InfoSection, InfoCard } from "./InfoLayout";

const VISA_TYPES = [
  {
    icon: "mdi:airplane",
    title: "Tourist e-Visa",
    detail:
      "30-day single entry, granted in 7–10 working days. Most common option for Pakistan visitors.",
  },
  {
    icon: "mdi:passport",
    title: "Visa on Arrival",
    detail:
      "Available to citizens of 50+ countries arriving by air at major airports. Valid 30 days.",
  },
  {
    icon: "mdi:badge-account-outline",
    title: "Business Visa",
    detail:
      "For meetings, conferences, and trade. Requires invitation letter from a Pakistani company.",
  },
  {
    icon: "mdi:hiking",
    title: "Trekking Permit (separate)",
    detail:
      "Required on top of your visa for restricted zones (K2 base camp, parts of Gilgit-Baltistan).",
  },
];

const ELIGIBLE_FOR_EVISA = [
  "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Japan", "South Korea", "UAE", "Singapore",
  "Malaysia", "Turkey", "Saudi Arabia", "China",
];

export function VisaPage() {
  return (
    <InfoLayout
      eyebrow="Resources"
      title="Pakistan visa info"
      icon="mdi:passport"
      intro="A practical overview of how to enter Pakistan as a tourist. Always confirm against the official portal before you book — rules change."
    >
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 mb-10 flex gap-3">
        <Icon
          icon="mdi:information-outline"
          className="text-accent text-xl shrink-0 mt-0.5"
        />
        <div className="text-sm text-fg/90 leading-relaxed">
          The official portal is{" "}
          <a
            href="https://visa.nadra.gov.pk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent font-semibold hover:underline"
          >
            visa.nadra.gov.pk
          </a>
          . Apply only there — third-party sites charge extra and can't grant
          visas.
        </div>
      </div>

      <InfoSection title="Visa types">
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          {VISA_TYPES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1, margin: "-50px" }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <InfoCard icon={v.icon} title={v.title}>
                <p>{v.detail}</p>
              </InfoCard>
            </motion.div>
          ))}
        </div>
      </InfoSection>

      <InfoSection title="What you'll need">
        <ul className="list-disc pl-5 space-y-2">
          <li>Passport valid for at least 6 months from arrival.</li>
          <li>One recent passport-size photo (white background).</li>
          <li>Proof of accommodation (hotel booking or invitation letter).</li>
          <li>Return or onward flight ticket.</li>
          <li>Bank statement or proof of funds (last 3 months).</li>
          <li>Visa fee — typically USD 35–60 depending on nationality.</li>
        </ul>
      </InfoSection>

      <InfoSection title="e-Visa eligible nationalities">
        <p>
          Citizens of the following countries can apply online for an e-Visa.
          The full list is on the official portal.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {ELIGIBLE_FOR_EVISA.map((c) => (
            <span
              key={c}
              className="px-3 py-1 rounded-full text-xs border border-line bg-surface-2 text-fg"
            >
              {c}
            </span>
          ))}
        </div>
      </InfoSection>

      <InfoSection title="Processing time">
        <p>
          E-Visas typically take 7–10 working days. Apply at least 3 weeks
          before your trip to be safe — peak summer months (June–August) run
          slower.
        </p>
      </InfoSection>

      <InfoSection title="Restricted areas">
        <p>
          Some regions require additional permits even with a valid visa:
          Gilgit-Baltistan border zones, Azad Kashmir near the LOC, parts of
          Khyber-Pakhtunkhwa. Your hotel or trekking operator usually handles
          these.
        </p>
      </InfoSection>
    </InfoLayout>
  );
}
