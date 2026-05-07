import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// Tunables. Kept in module scope so they get inlined and never re-created.
const SHOW_DELAY_MS = 150;     // skip the bar for navigations faster than this
const TRICKLE_TARGET = 85;     // never sit at 100% until we know we're done
const TRICKLE_DURATION_MS = 700;
const FORCE_COMPLETE_MS = 850; // upper bound after which we always finish
const COMPLETE_HOLD_MS = 180;  // briefly hold at 100% so the user *sees* it
const FADE_MS = 250;

// Fixed-position, theme-aware top loading bar. Listens for React Router
// navigation via `useLocation()` and animates a thin gradient stripe across
// the top of the viewport while the next route mounts.
//
// Design notes:
// - Width is driven by component state but CSS handles the easing so we
//   don't pay the cost of a frame-by-frame React render.
// - rAF drives the trickle so we only `setState` when the browser is going
//   to paint anyway. With the CSS easing this means ~5–8 renders per nav
//   instead of one per frame.
// - All timers/rAF handles are tracked in a ref bag and cancelled
//   aggressively on rapid back-to-back nav (browser back/forward, redirect
//   chains) so we don't leak handles or leave the bar stuck visible.
// - `aria-hidden` because the bar is decorative; the route change itself is
//   the announcement boundary for assistive tech.
export function TopProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Skip the very first mount — there's no transition to animate then.
  const firstRenderRef = useRef(true);
  // Bag of all in-flight handles for the *current* navigation cycle.
  const handlesRef = useRef({
    show: null,
    complete: null,
    hold: null,
    reset: null,
    raf: null,
  });

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    const handles = handlesRef.current;
    cancelAll(handles);

    let didShow = false;

    handles.show = setTimeout(() => {
      didShow = true;
      setVisible(true);
      setProgress(20);

      const start = performance.now();
      const trickle = () => {
        const elapsed = performance.now() - start;
        const next = Math.min(
          20 + (elapsed / TRICKLE_DURATION_MS) * (TRICKLE_TARGET - 20),
          TRICKLE_TARGET
        );
        setProgress(next);
        if (next < TRICKLE_TARGET) {
          handles.raf = requestAnimationFrame(trickle);
        }
      };
      handles.raf = requestAnimationFrame(trickle);
    }, SHOW_DELAY_MS);

    handles.complete = setTimeout(() => {
      // Tear down trickle + show timer regardless of whether we ever showed.
      cancelHandle(handles, "show");
      cancelHandle(handles, "raf", true);

      if (!didShow) return;

      setProgress(100);
      handles.hold = setTimeout(() => {
        setVisible(false);
        // Reset *after* the fade so the bar doesn't snap to 0% on screen.
        handles.reset = setTimeout(() => setProgress(0), FADE_MS + 50);
      }, COMPLETE_HOLD_MS);
    }, SHOW_DELAY_MS + FORCE_COMPLETE_MS);

    return () => cancelAll(handles);
    // location.key is unique per nav, including back/forward + replace, so
    // it captures every transition pathname alone would miss.
  }, [location.key]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: "easeOut" }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[2.5px]"
        >
          <div
            className="h-full origin-left"
            style={{
              width: `${progress}%`,
              transition: "width 200ms cubic-bezier(0.22, 1, 0.36, 1)",
              background:
                "linear-gradient(90deg, rgb(var(--accent) / 0.7) 0%, rgb(var(--accent)) 50%, rgb(var(--accent) / 0.95) 100%)",
              boxShadow:
                "0 0 12px rgb(var(--accent) / 0.55), 0 0 4px rgb(var(--accent) / 0.45)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function cancelHandle(handles, key, isRaf = false) {
  const id = handles[key];
  if (id == null) return;
  if (isRaf) cancelAnimationFrame(id);
  else clearTimeout(id);
  handles[key] = null;
}

function cancelAll(handles) {
  cancelHandle(handles, "show");
  cancelHandle(handles, "complete");
  cancelHandle(handles, "hold");
  cancelHandle(handles, "reset");
  cancelHandle(handles, "raf", true);
}
