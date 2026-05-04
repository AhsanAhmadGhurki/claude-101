import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "antd";
import { Icon } from "@iconify/react";
import { ThemeToggle } from "../ui/ThemeToggle";

const linkClass = ({ isActive }) =>
  `relative text-sm font-medium transition ${
    isActive
      ? "text-fg after:absolute after:left-0 after:-bottom-1.5 after:h-[2px] after:w-full after:bg-accent after:rounded-full"
      : "text-fg-muted hover:text-fg"
  }`;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-30 transition-all duration-300 ${
        scrolled
          ? "bg-bg/85 backdrop-blur-md border-b border-line"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-8 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-fg"
        >
          Adventure<span className="text-accent">.AI</span>
        </Link>

        <nav className="hidden sm:flex gap-7">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/explore" className={linkClass}>
            Explore
          </NavLink>
          <NavLink to="/builder" className={linkClass}>
            Trip Builder
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            type="primary"
            onClick={() => navigate("/builder")}
            className="!hidden sm:!inline-flex !font-semibold"
          >
            Plan a trip
          </Button>
        </div>
      </div>
    </header>
  );
}
