// Parental time-limit: per-profile daily minute budget. Adds minutes from
// continue-watching updates and exposes a banner event when the budget is hit.

import { ns } from "./profiles";

const PREF_KEY_SUFFIX = "time_limit";

function prefKey() {
  try {
    return ns(`prefs_${PREF_KEY_SUFFIX}`);
  } catch (e) {
    return "aflixs_main_prefs_time_limit";
  }
}

function todayKey() {
  try {
    return ns(`time_limit_${new Date().toISOString().slice(0, 10)}`);
  } catch (e) {
    return `aflixs_main_time_limit_${new Date().toISOString().slice(0, 10)}`;
  }
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore quota
  }
}

export function getTimeLimit() {
  // minutes per day, 0 = off
  const v = readJSON(prefKey(), { minutes: 0 });
  return Math.max(0, Math.min(720, Number(v?.minutes) || 0));
}

export function setTimeLimit(minutes) {
  const m = Math.max(0, Math.min(720, Math.round(Number(minutes) || 0)));
  writeJSON(prefKey(), { minutes: m, updatedAt: Date.now() });
  try {
    window.dispatchEvent(new CustomEvent("aflixs:time-limit-changed"));
  } catch (e) {
    // ignore
  }
  return m;
}

export function getUsedToday() {
  return Math.max(0, Math.round(Number(readJSON(todayKey(), 0)) || 0));
}

export function getRemainingToday() {
  const limit = getTimeLimit();
  if (limit <= 0) return Infinity;
  return Math.max(0, limit - getUsedToday());
}

export function isOverBudget() {
  const limit = getTimeLimit();
  if (limit <= 0) return false;
  return getUsedToday() >= limit;
}

export function addWatchedMinutes(minutes) {
  const n = Math.max(0, Math.round(Number(minutes) || 0));
  if (n === 0) return getUsedToday();
  const used = getUsedToday() + n;
  writeJSON(todayKey(), used);
  try {
    window.dispatchEvent(new CustomEvent("aflixs:time-limit-changed"));
  } catch (e) {
    // ignore
  }
  if (isOverBudget()) {
    try {
      window.dispatchEvent(new CustomEvent("aflixs:time-limit-hit"));
    } catch (e) {
      // ignore
    }
  }
  return used;
}

export function resetToday() {
  writeJSON(todayKey(), 0);
  try {
    window.dispatchEvent(new CustomEvent("aflixs:time-limit-changed"));
  } catch (e) {
    // ignore
  }
}

export function onTimeLimitChanged(cb) {
  const handler = () => {
    try {
      cb({ limit: getTimeLimit(), used: getUsedToday(), over: isOverBudget() });
    } catch (e) {
      // ignore
    }
  };
  window.addEventListener("aflixs:time-limit-changed", handler);
  return () => window.removeEventListener("aflixs:time-limit-changed", handler);
}
