import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Button, App } from "antd";
import { motion } from "framer-motion";
import { InfoLayout } from "./InfoLayout";

const CATEGORIES = [
  {
    key: "documents",
    label: "Documents",
    icon: "mdi:passport",
    items: [
      "Passport (valid 6+ months)",
      "Pakistan visa printout",
      "Trekking permits (if applicable)",
      "Travel insurance card",
      "Two passport photos",
      "Driver's license / IDP",
      "Emergency contacts (printed)",
      "Cash in PKR + USD backup",
      "Credit/debit cards (notify bank)",
    ],
  },
  {
    key: "clothing",
    label: "Clothing",
    icon: "mdi:tshirt-crew-outline",
    items: [
      "Base layers (merino or synthetic)",
      "Insulating mid-layer (fleece or down)",
      "Waterproof shell jacket",
      "Trekking pants (×2)",
      "Quick-dry shirts (×3–4)",
      "Warm hat & sun hat",
      "Buff / neck gaiter",
      "Gloves (light + insulated)",
      "Wool hiking socks (×4)",
      "Modest layer for cultural sites",
    ],
  },
  {
    key: "footwear",
    label: "Footwear",
    icon: "mdi:shoe-hiking",
    items: [
      "Broken-in hiking boots",
      "Trail runners or sneakers",
      "Camp sandals or Crocs",
      "Gaiters (snow / scree)",
      "Microspikes (winter / glacier)",
    ],
  },
  {
    key: "gear",
    label: "Trekking gear",
    icon: "mdi:bag-personal-outline",
    items: [
      "30–40L daypack",
      "Trekking poles",
      "Sleeping bag (-5°C rated for high camps)",
      "Headlamp + spare batteries",
      "Water bottles or bladder (2L+)",
      "Water purification (filter or tablets)",
      "Sunglasses (Cat 3+ for snow)",
      "Sunscreen SPF 50",
      "Lip balm with SPF",
      "Power bank (20,000 mAh)",
      "Universal travel adapter",
    ],
  },
  {
    key: "health",
    label: "Health & first aid",
    icon: "mdi:medical-bag",
    items: [
      "Personal prescriptions",
      "Diamox (altitude sickness)",
      "Ibuprofen / paracetamol",
      "Loperamide (stomach issues)",
      "ORS sachets",
      "Antiseptic + bandages",
      "Blister plasters",
      "Tweezers",
      "Antihistamine",
      "Insect repellent (DEET 30%+)",
    ],
  },
  {
    key: "extras",
    label: "Nice to have",
    icon: "mdi:camera-outline",
    items: [
      "Camera + spare SD cards",
      "Lightweight tripod",
      "Notebook & pen",
      "Book or e-reader",
      "Snacks from home (energy bars)",
      "Small gifts for hosts",
      "Dry bag (for monsoon / rafting)",
      "Travel pillow",
    ],
  },
];

const STORAGE_KEY = "packingChecklist";

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function PackingPage() {
  const { message } = App.useApp();
  const [checked, setChecked] = useState(loadState);

  const toggle = (id) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    setChecked({});
    localStorage.removeItem(STORAGE_KEY);
    message.success({ content: "Checklist reset", duration: 1.5 });
  };

  const totals = useMemo(() => {
    const all = CATEGORIES.flatMap((c) => c.items.map((it) => `${c.key}:${it}`));
    const done = all.filter((id) => checked[id]).length;
    return { done, total: all.length };
  }, [checked]);

  const pct = totals.total ? Math.round((totals.done / totals.total) * 100) : 0;

  return (
    <InfoLayout
      eyebrow="Resources"
      title="Packing checklist"
      icon="mdi:checkbox-marked-circle-outline"
      intro="A flexible checklist for adventure travel in Pakistan. Tick what you've packed — your progress saves to this browser. Skip categories that don't apply to your trip."
    >
      <div className="rounded-2xl border border-line bg-surface surface-shadow p-5 mb-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-fg-subtle font-bold">
              Progress
            </p>
            <p className="text-2xl font-bold text-fg mt-1">
              {totals.done}{" "}
              <span className="text-fg-subtle text-base font-medium">
                / {totals.total} items
              </span>
            </p>
          </div>
          <Button
            onClick={reset}
            icon={<Icon icon="mdi:refresh" />}
            disabled={!totals.done}
          >
            Reset
          </Button>
        </div>
        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full bg-accent"
          />
        </div>
      </div>

      <div className="space-y-8">
        {CATEGORIES.map((cat, ci) => {
          const catDone = cat.items.filter(
            (it) => checked[`${cat.key}:${it}`]
          ).length;
          return (
            <motion.section
              key={cat.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: ci * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-line bg-surface surface-shadow p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <Icon icon={cat.icon} className="text-xl" />
                  </div>
                  <h3 className="text-xl font-bold text-fg tracking-tight">
                    {cat.label}
                  </h3>
                </div>
                <span className="text-xs text-fg-subtle font-mono">
                  {catDone} / {cat.items.length}
                </span>
              </div>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                {cat.items.map((it) => {
                  const id = `${cat.key}:${it}`;
                  const isChecked = !!checked[id];
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        className="group flex items-start gap-2.5 w-full text-left py-1.5 hover:bg-surface-hover/60 rounded-lg px-1 transition"
                      >
                        <span
                          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                            isChecked
                              ? "bg-accent border-accent text-accent-fg"
                              : "border-line group-hover:border-line-strong"
                          }`}
                        >
                          {isChecked && (
                            <Icon icon="mdi:check" className="text-sm" />
                          )}
                        </span>
                        <span
                          className={`text-sm leading-snug transition ${
                            isChecked
                              ? "text-fg-subtle line-through"
                              : "text-fg/90"
                          }`}
                        >
                          {it}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.section>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-6 flex gap-4 items-start">
        <Icon
          icon="mdi:lightbulb-on-outline"
          className="text-accent text-2xl shrink-0 mt-0.5"
        />
        <div className="text-sm text-fg/90 leading-relaxed">
          <strong className="text-fg">Pro tip:</strong> for high-altitude treks
          above 4,000m, double-check your sleeping bag's comfort rating against
          expected night temps. Add 5°C of margin for safety — hypothermia
          ruins more trips than blisters.
        </div>
      </div>
    </InfoLayout>
  );
}
