import { Header } from "./Header";
import { Footer } from "./Footer";
import { useSmoothScroll } from "../../../client/src/hooks/useSmoothScroll";

export function PageShell({ children }) {
  useSmoothScroll();
  return (
    <div className="relative min-h-screen flex flex-col bg-bg text-fg transition-colors">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
