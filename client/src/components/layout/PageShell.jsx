import { Header } from "./Header";
import { Footer } from "./Footer";
import { useSmoothScroll } from "../../hooks/useSmoothScroll";

export function PageShell({ children }) {
  useSmoothScroll();
  return (
    <div className="relative min-h-screen flex flex-col bg-bg text-fg transition-colors">
      {/* Keyboard-only skip link — visually hidden until focused, then
          jumps focus past the header straight to page content. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent focus:text-accent-fg focus:font-semibold focus:shadow-lg"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
