// Sleep timer (mock): per-profile, persisted last choice. The modal reads
// it and shows a countdown; closing the modal cancels the active timer.
// Storage: aflixs_<profile>_sleep_timer_choice (string id)

import { ns } from "./profiles";

export const SLEEP_OPTIONS = [
  { id: "off", label: "Off", minutes: 0 },
  { id: "15", label: "15 minutes", minutes: 15 },
  { id: "30", label: "30 minutes", minutes: 30 },
  { id: "60", label: "60 minutes", minutes: 60 },
  { id: "eot", label: "End of title", minutes: -1 },
];

function choiceKey() {
  try {
    return ns("sleep_timer_choice");
  } catch (e) {
    return "aflixs_main_sleep_timer_choice";
  }
}

export function getSleepChoice() {
  try {
    const raw = localStorage.getItem(choiceKey());
    if (raw && SLEEP_OPTIONS.some((o) => o.id === raw)) return raw;
  } catch (e) {
    // ignore
  }
  return "off";
}

export function setSleepChoice(id) {
  if (!SLEEP_OPTIONS.some((o) => o.id === id)) return getSleepChoice();
  try {
    localStorage.setItem(choiceKey(), id);
  } catch (e) {
    // ignore
  }
  try {
    window.dispatchEvent(new CustomEvent("aflixs:sleep-timer-changed", { detail: { id } }));
  } catch (e) {
    // ignore
  }
  return id;
}

export function onSleepChanged(cb) {
  const handler = (e) => {
    const id = e.detail && e.detail.id ? e.detail.id : getSleepChoice();
    try {
      cb(id);
    } catch (err) {
      // ignore
    }
  };
  window.addEventListener("aflixs:sleep-timer-changed", handler);
  window.addEventListener("aflixs:profile-switched", handler);
  return () => {
    window.removeEventListener("aflixs:sleep-timer-changed", handler);
    window.removeEventListener("aflixs:profile-switched", handler);
  };
}

// Compute the seconds remaining for a given choice + title runtime in minutes.
// Returns { seconds, label } or null when not active.
export function computeTimerSeconds(choice, runtimeMinutes, elapsedSeconds = 0) {
  const opt = SLEEP_OPTIONS.find((o) => o.id === choice);
  if (!opt || opt.id === "off") return null;
  if (opt.id === "eot") {
    const runtime = Math.max(0, Number(runtimeMinutes) || 0) * 60;
    const remaining = Math.max(0, runtime - Math.max(0, Number(elapsedSeconds) || 0));
    return { seconds: remaining, label: "Ends with title" };
  }
  return { seconds: opt.minutes * 60, label: opt.label };
}

// Format seconds as mm:ss, dropping the hours when not needed.
export function formatTimer(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
