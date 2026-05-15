// Canonical localStorage key for the user's theme preference.
//
// Exported as a constant so the React provider and any other consumer share
// one source of truth. The pre-hydration boot script in `client/index.html`
// must read the same key — keep them in sync.

export const THEME_STORAGE_KEY = "theme";

// The previous key used before the rename. Read-only — we migrate any value
// stored under this key into the new key on first load.
export const LEGACY_THEME_STORAGE_KEY = "adventure.theme";
