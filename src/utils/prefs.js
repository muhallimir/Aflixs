// App-wide preferences (persisted, no new dependencies).
// Keys: autoplayTrailers, maturityLevel ("all" | "pg" | "kids"),
// kidsMode (bool), language (TMDB language pref).

const PREFS_KEY = "aflixs_prefs";

export const DEFAULT_PREFS = {
  autoplayTrailers: true,
  maturityLevel: "all",
  kidsMode: false,
  language: "en-US",
};

function readPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...(parsed || {}) };
  } catch (e) {
    return { ...DEFAULT_PREFS };
  }
}

export function getPrefs() {
  return readPrefs();
}

export function setPrefs(patch) {
  const next = { ...readPrefs(), ...(patch || {}) };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch (e) {
    // ignore quota errors
  }
  try {
    window.dispatchEvent(new CustomEvent("aflixs:prefs-changed", { detail: next }));
  } catch (e) {
    // ignore
  }
  return next;
}

export function resetPrefs() {
  try {
    localStorage.removeItem(PREFS_KEY);
  } catch (e) {
    // ignore
  }
  try {
    window.dispatchEvent(
      new CustomEvent("aflixs:prefs-changed", { detail: { ...DEFAULT_PREFS } })
    );
  } catch (e) {
    // ignore
  }
  return { ...DEFAULT_PREFS };
}

export function onPrefsChanged(cb) {
  const handler = (e) => cb(e.detail || readPrefs());
  window.addEventListener("aflixs:prefs-changed", handler);
  return () => window.removeEventListener("aflixs:prefs-changed", handler);
}
