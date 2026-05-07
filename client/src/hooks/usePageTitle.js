import { useEffect } from "react";

const SUFFIX = "Adventure.AI";
const HOME_TITLE = "Adventure.AI — Plan less. Wander more.";

// Sets `document.title` for the lifetime of a page component, then restores
// the previous value on unmount so a back-button nav doesn't leave a stale
// title on the home page.
//
// Pass a short page-specific phrase (e.g. "Sign in") and the hook formats it
// as "Sign in — Adventure.AI". Pass nothing on the home page and you'll get
// the marketing default. Pass `{ raw: true }` to set the title verbatim
// (useful for share / detail pages where the destination name is the title).
export function usePageTitle(label, opts = {}) {
  useEffect(() => {
    const prev = document.title;
    if (!label) {
      document.title = HOME_TITLE;
    } else if (opts.raw) {
      document.title = label;
    } else {
      document.title = `${label} — ${SUFFIX}`;
    }
    return () => {
      document.title = prev;
    };
    // opts is read on first render only; consumers that need dynamic titles
    // pass a fresh `label` value, which is what drives the re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);
}
