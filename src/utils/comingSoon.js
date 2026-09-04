// Coming-soon calendar with per-title reminders. Picks the next 4 upcoming
// weekends, pairs each with a mock title (or a real one when demo mode is
// off), and stores "remind me" toggles per profile in localStorage.

import { ns } from "./profiles";

const KEY_REMINDERS = "reminders";
const KEY_EVENTS = "events";

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

function reminderKey() {
  try {
    return ns(KEY_REMINDERS);
  } catch (e) {
    return "aflixs_main_reminders";
  }
}

function eventsKey() {
  try {
    return ns(KEY_EVENTS);
  } catch (e) {
    return "aflixs_main_events";
  }
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function buildWeekendEvents(catalog = []) {
  const out = [];
  const start = startOfToday();
  let cursor = new Date(start);
  // Advance to the next Saturday.
  while (cursor.getDay() !== 6) {
    cursor.setDate(cursor.getDate() + 1);
  }
  for (let i = 0; i < 4; i += 1) {
    const date = new Date(cursor);
    date.setDate(date.getDate() + i * 7);
    const title = catalog[i % Math.max(catalog.length, 1)] || null;
    out.push({
      id: `weekend-${date.toISOString().slice(0, 10)}`,
      dateISO: date.toISOString(),
      label: date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      title,
    });
  }
  return out;
}

export function getEvents() {
  const raw = readJSON(eventsKey(), null);
  if (Array.isArray(raw) && raw.length === 4) return raw;
  return [];
}

export function setEvents(events) {
  if (!Array.isArray(events)) return [];
  writeJSON(eventsKey(), events);
  try {
    window.dispatchEvent(new CustomEvent("aflixs:coming-soon-changed"));
  } catch (e) {
    // ignore
  }
  return events;
}

export function getReminders() {
  const raw = readJSON(reminderKey(), {});
  return raw && typeof raw === "object" ? raw : {};
}

export function toggleReminder(eventId) {
  const current = getReminders();
  const next = { ...current, [eventId]: !current[eventId] };
  writeJSON(reminderKey(), next);
  try {
    window.dispatchEvent(new CustomEvent("aflixs:coming-soon-changed"));
  } catch (e) {
    // ignore
  }
  return next;
}

export function dueReminders() {
  const events = getEvents();
  const reminders = getReminders();
  const now = Date.now();
  return events.filter((e) => {
    if (!reminders[e.id]) return false;
    const t = new Date(e.dateISO).getTime();
    return t <= now + 24 * 60 * 60 * 1000;
  });
}

export function onComingSoonChanged(cb) {
  const handler = () => {
    try {
      cb({ events: getEvents(), reminders: getReminders() });
    } catch (e) {
      // ignore
    }
  };
  window.addEventListener("aflixs:coming-soon-changed", handler);
  window.addEventListener("aflixs:profile-switched", handler);
  return () => {
    window.removeEventListener("aflixs:coming-soon-changed", handler);
    window.removeEventListener("aflixs:profile-switched", handler);
  };
}
