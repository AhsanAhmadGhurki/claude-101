import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { InfoLayout, InfoSection, InfoCard } from "./InfoLayout";

const TOPICS = [
  {
    icon: "mdi:medical-bag",
    title: "Altitude sickness",
    body: "Above 2,500m, ascend slowly: don't gain more than 500m in sleeping altitude per day. Symptoms (headache, nausea, dizziness) mean stop and acclimatize. Diamox helps prevention but isn't a cure — descend if symptoms worsen.",
  },
  {
    icon: "mdi:water-outline",
    title: "Water & food",
    body: "Tap water is not safe outside major hotels. Use a filter, purification tablets, or boil for 1 minute (3 minutes above 2,000m). Stick to busy local restaurants where turnover keeps food fresh; freshly cooked beats anything that's been sitting.",
  },
  {
    icon: "mdi:weather-lightning-rainy",
    title: "Weather & roads",
    body: "Karakoram Highway is prone to landslides during monsoon (Jul–Aug) and after spring melt. Check road status with your hotel before transit days. Build buffer days into northern itineraries.",
  },
  {
    icon: "mdi:shield-check-outline",
    title: "Personal safety",
    body: "Pakistan is generally safe for tourists in the regions covered here. Petty theft is rare. Avoid solo travel after dark in unfamiliar urban areas. Women travelers should dress modestly especially outside major cities.",
  },
  {
    icon: "mdi:cash-multiple",
    title: "Money & scams",
    body: "Carry small bills — change for large notes is hard in remote areas. Negotiate fares before getting in a taxi or rickshaw. ATMs work in cities; bring USD as backup for the north where ATMs may be offline.",
  },
  {
    icon: "mdi:cellphone-information",
    title: "Connectivity",
    body: "Get a Jazz or Zong SIM at the airport (passport required). Mobile coverage is good on KKH and major valleys but spotty in remote treks. Download offline maps before heading north.",
  },
];

const EMERGENCY = [
  { label: "Police", number: "15" },
  { label: "Ambulance / Rescue 1122", number: "1122" },
  { label: "Fire", number: "16" },
  { label: "Mountain Rescue (Gilgit)", number: "+92 581 920 0530" },
  { label: "Tourist Police", number: "1422" },
];

const HEALTH_KIT = [
  "Diamox (acetazolamide) for altitude",
  "Loperamide for traveler's diarrhea",
  "Oral rehydration salts (ORS)",
  "Broad-spectrum antibiotic (consult doctor)",
  "Antiseptic + bandages + blister plasters",
  "Personal medications (with prescription)",
];

export function SafetyPage() {
  return (
    <InfoLayout
      eyebrow="Resources"
      title="Travel safety"
      icon="mdi:shield-alert-outline"
      intro="Practical safety guidance for adventure travel in Pakistan. None of this should put you off — most trips go without a hitch. But preparation is what makes that the case."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-accent/30 bg-accent/5 p-5 mb-12 flex gap-3"
      >
        <Icon
          icon="mdi:phone-alert-outline"
          className="text-accent text-2xl shrink-0 mt-0.5"
        />
        <div className="text-sm text-fg/90 leading-relaxed">
          <strong className="text-fg">Save these numbers offline.</strong>{" "}
          Coverage on remote treks is spotty — having emergency contacts
          screenshot or written down is the difference between a delay and a
          crisis.
        </div>
      </motion.div>

      <InfoSection title="Emergency numbers">
        <div className="rounded-2xl border border-line bg-surface surface-shadow overflow-hidden mt-4">
          {EMERGENCY.map((e, i) => (
            <div
              key={e.label}
              className={`flex items-center justify-between px-5 py-4 ${
                i !== 0 ? "border-t border-line" : ""
              }`}
            >
              <span className="text-sm font-medium text-fg">{e.label}</span>
              <a
                href={`tel:${e.number.replace(/\s/g, "")}`}
                className="font-mono text-base font-bold text-accent hover:underline tabular-nums"
              >
                {e.number}
              </a>
            </div>
          ))}
        </div>
      </InfoSection>

      <InfoSection title="Key topics">
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {TOPICS.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1, margin: "-50px" }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <InfoCard icon={t.icon} title={t.title}>
                <p>{t.body}</p>
              </InfoCard>
            </motion.div>
          ))}
        </div>
      </InfoSection>

      <InfoSection title="Health kit essentials">
        <p>Pack these in your carry-on, not your checked bag.</p>
        <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {HEALTH_KIT.map((h) => (
            <li
              key={h}
              className="flex items-start gap-2 text-sm text-fg/90"
            >
              <Icon
                icon="mdi:check-circle"
                className="text-accent shrink-0 mt-0.5"
              />
              {h}
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection title="Insurance">
        <p>
          Get travel insurance that explicitly covers high-altitude trekking
          (above 4,000m) and emergency helicopter evacuation. Standard policies
          often exclude both — read the fine print or ask before buying. For
          K2 base camp and similar, expect to pay extra.
        </p>
      </InfoSection>

      <InfoSection title="Before you go">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Check your home country's travel advisory for Pakistan.
          </li>
          <li>
            Register with your embassy if you're going off the standard tourist
            track for more than a week.
          </li>
          <li>
            Photocopy passport, visa, and insurance — keep one copy with you and
            email a copy to yourself.
          </li>
          <li>
            Tell someone at home your itinerary, with dates of expected
            check-ins.
          </li>
          <li>
            Get vaccinations recommended for South Asia (Hep A, Typhoid, Tdap
            booster). Consult a travel clinic 4–6 weeks before departure.
          </li>
        </ul>
      </InfoSection>
    </InfoLayout>
  );
}
