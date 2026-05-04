import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Explore", to: "/explore" },
  { label: "Trip Builder", to: "/builder" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface/40">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-fg font-bold tracking-tight">
          <span className="inline-flex w-8 h-8 rounded-lg bg-accent text-accent-fg items-center justify-center">
            <Icon icon="mdi:compass-outline" className="text-xl" />
          </span>
          Adventure<span className="text-accent">.AI</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-fg-muted">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="hover:text-fg transition"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-fg-subtle">
          © {new Date().getFullYear()} Adventure.AI — plan your next journey.
        </p>
      </div>
    </footer>
  );
}
