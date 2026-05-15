import { useEffect, useRef } from "react";

// Persist a form's state to localStorage so refresh / accidental nav doesn't
// throw away the user's typed inputs. Returns nothing — call sites pass the
// current values in and use the returned `restore` callback once on mount
// to rehydrate. We deliberately keep this small: callers own their state,
// this hook just mirrors it.

const TTL_MS = 24 * 60 * 60 * 1000;

function readDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { value, savedAt } = JSON.parse(raw);
    if (!savedAt || Date.now() - savedAt > TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return value ?? null;
  } catch {
    return null;
  }
}

function writeDraft(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ value, savedAt: Date.now() })
    );
  } catch {
    // Quota / private mode — skip silently.
  }
}

export function loadFormDraft(key) {
  return readDraft(key);
}

export function clearFormDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Debounced autosave for a form's serialisable state. Writes to
 * `localStorage[key]` whenever `value` changes (after a brief settle).
 */
export function useFormDraft(key, value, { debounceMs = 600, enabled = true } = {}) {
  const timer = useRef(null);
  useEffect(() => {
    if (!enabled || !key) return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => writeDraft(key, value), debounceMs);
    return () => clearTimeout(timer.current);
  }, [key, value, debounceMs, enabled]);
}
