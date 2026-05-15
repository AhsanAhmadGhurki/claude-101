import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Lenis intercepts wheel + touch events to smooth the scroll. When a text
// input is focused, this can manifest as "scroll feels stuck" because the
// browser routes the gesture to the focused control instead of scrolling
// the page. We pause Lenis whenever a text-entry control is focused and
// resume on blur — the page falls back to native scrolling while the user
// is typing, then snaps back into the smooth experience.
function isTextEntryTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA") return true;
  if (tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  if (tag === "INPUT") {
    const type = (el.type || "text").toLowerCase();
    // Buttons / checkboxes / radios are also <input> but don't capture the
    // gesture in a way that conflicts with smooth scroll.
    return !["button", "submit", "checkbox", "radio", "reset", "file"].includes(
      type
    );
  }
  return false;
}

export function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Toggle smoothWheel off while a text-entry control is focused so the
    // browser's native wheel/touch handling reaches the page. Resume smooth
    // scrolling on blur. Toggling the option is more reliable than
    // `stop()`/`start()` which can leave Lenis's wheel listener active.
    const setSmoothWheel = (value) => {
      if (!lenis?.options) return;
      lenis.options.smoothWheel = value;
    };
    const onFocusIn = (e) => {
      if (isTextEntryTarget(e.target)) setSmoothWheel(false);
    };
    const onFocusOut = (e) => {
      if (isTextEntryTarget(e.target)) setSmoothWheel(true);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
}
