import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { InfoLayout, InfoSection } from "./InfoLayout";

const SEASONS = [
  {
    key: "spring",
    label: "Spring",
    months: "Mar – May",
    icon: "mdi:flower-outline",
    color: "from-emerald-500/20 to-emerald-500/5",
    summary:
      "Snowmelt opens valleys, blossoms erupt in Hunza, rivers run high. The most photogenic window in the north.",
    best: ["Hunza Valley", "Skardu", "Naran-Kaghan (lower)", "Swat Valley"],
    avoid: ["High passes still snowed in until late May"],
  },
  {
    key: "summer",
    label: "Summer",
    months: "Jun – Aug",
    icon: "mdi:weather-sunny",
    color: "from-amber-400/20 to-amber-400/5",
    summary:
      "Peak season. Karakoram passes open, K2 base camp accessible, glacier treks at their best. Lowlands hot — head north.",
    best: ["Fairy Meadows", "Khunjerab Pass", "Deosai Plains", "K2 base camp"],
    avoid: ["Cholistan, Lahore, Multan (40°C+)"],
  },
  {
    key: "autumn",
    label: "Autumn",
    months: "Sep – Nov",
    icon: "mdi:leaf",
    color: "from-orange-500/20 to-orange-500/5",
    summary:
      "Golden poplars, clear skies, lower crowds. The connoisseur's season — locals consider this the most beautiful time.",
    best: ["Hunza", "Skardu", "Chitral", "Kalash Valley"],
    avoid: ["Higher passes start closing late October"],
  },
  {
    key: "winter",
    label: "Winter",
    months: "Dec – Feb",
    icon: "mdi:snowflake",
    color: "from-sky-400/20 to-sky-400/5",
    summary:
      "Deep snow seals off most of Gilgit-Baltistan. South Punjab and Sindh become ideal — desert temperatures drop to perfection.",
    best: ["Cholistan", "Lahore", "Karachi", "Mohenjo-daro"],
    avoid: ["Skardu, Khunjerab, Fairy Meadows (often inaccessible)"],
  },
];

const REGION_GUIDE = [
  { region: "Hunza & Gilgit-Baltistan", best: "Apr – Oct", peak: "Jun – Aug" },
  { region: "Fairy Meadows / Nanga Parbat", best: "May – Sep", peak: "Jul – Aug" },
  { region: "Skardu & Deosai", best: "Jun – Sep", peak: "Jul – Aug" },
  { region: "Chitral & Kalash", best: "May – Oct", peak: "Sep (festivals)" },
  { region: "Naran-Kaghan", best: "May – Oct", peak: "Jun – Aug" },
  { region: "Swat Valley", best: "Mar – Nov", peak: "Apr – Jun" },
  { region: "Cholistan Desert", best: "Nov – Feb", peak: "Dec – Jan" },
  { region: "Lahore (cultural)", best: "Oct – Mar", peak: "Nov – Feb" },
];

export function BestTimePage() {
  return (
    <InfoLayout
      eyebrow="Resources"
      title="Best time to visit"
      icon="mdi:calendar-month-outline"
      intro="Pakistan packs five climate zones into one country. Pick your season carefully — the same valley is unrecognizable in January and July."
    >
      <InfoSection title="The four seasons">
        <div className="grid md:grid-cols-2 gap-5 mt-4">
          {SEASONS.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl border border-line bg-surface surface-shadow overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${s.color} pointer-events-none`}
              />
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <Icon icon={s.icon} className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-fg">{s.label}</h3>
                    <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">
                      {s.months}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-fg-muted leading-relaxed mb-4">
                  {s.summary}
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-bold">
                      Best for
                    </span>
                    <p className="text-fg/90 mt-1">{s.best.join(" · ")}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-fg-subtle font-bold">
                      Heads up
                    </span>
                    <p className="text-fg-muted mt-1">{s.avoid.join(" · ")}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </InfoSection>

      <InfoSection title="By region">
        <div className="rounded-2xl border border-line bg-surface surface-shadow overflow-hidden mt-4">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-fg-subtle">
              <tr className="text-left">
                <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-[11px]">
                  Region
                </th>
                <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-[11px]">
                  Open window
                </th>
                <th className="px-5 py-3 font-semibold uppercase tracking-[0.15em] text-[11px]">
                  Peak
                </th>
              </tr>
            </thead>
            <tbody>
              {REGION_GUIDE.map((r, i) => (
                <tr
                  key={r.region}
                  className={i % 2 === 0 ? "" : "bg-surface-2/40"}
                >
                  <td className="px-5 py-3 font-medium text-fg">{r.region}</td>
                  <td className="px-5 py-3 text-fg-muted">{r.best}</td>
                  <td className="px-5 py-3 text-accent font-semibold">
                    {r.peak}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoSection>

      <InfoSection title="Quick rules of thumb">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-fg">Mountains in summer, deserts in
            winter.</strong>{" "}
            That single rule covers 80% of trip planning here.
          </li>
          <li>
            <strong className="text-fg">Shoulder seasons</strong> (May, September)
            give you the best balance of access, weather, and quiet trails.
          </li>
          <li>
            Eid holidays cause a domestic-tourism spike — book accommodation
            weeks ahead if your trip overlaps.
          </li>
          <li>
            Monsoon (Jul–Aug) brings landslides on KKH; build buffer days into
            northern itineraries.
          </li>
        </ul>
      </InfoSection>
    </InfoLayout>
  );
}
