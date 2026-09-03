// Skip-recap / Skip-intro (mock): based on a title's runtime, fake
// "intro" and "recap" durations that surface click-to-dismiss buttons on
// the open detail modal. The buttons are clearly labeled as mocked.

export const SKIP_INTRO_SECONDS = 90;
export const SKIP_RECAP_SECONDS = 30;

// Choose a duration that respects the title runtime so the buttons never
// appear on a title that's clearly too short.
export function computeSkipTargets(runtimeMinutes) {
  const runtime = Math.max(0, Math.floor(Number(runtimeMinutes) || 0));
  if (runtime <= 0) {
    return { intro: SKIP_INTRO_SECONDS, recap: SKIP_RECAP_SECONDS, hasIntro: true, hasRecap: true };
  }
  const total = runtime * 60;
  // Mock heuristics: show "intro" when the title is longer than 12 minutes,
  // and "recap" when it's a TV-style entry longer than 22 minutes (where a
  // previously-on segment makes sense).
  return {
    intro: Math.min(SKIP_INTRO_SECONDS, Math.floor(total / 4) || SKIP_INTRO_SECONDS),
    recap: Math.min(SKIP_RECAP_SECONDS, Math.floor(total / 8) || SKIP_RECAP_SECONDS),
    hasIntro: total >= 12 * 60,
    hasRecap: total >= 22 * 60,
  };
}

export function formatSkip(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
