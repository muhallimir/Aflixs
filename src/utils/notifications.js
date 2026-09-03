// Notifications center (per-profile, persisted).
// Stores a small digest list; bell shows unread dot until mark-read.

import { ns } from "./profiles";

const MAX_ITEMS = 20;

function key() {
  try {
    return ns("notifications");
  } catch (e) {
    return "aflixs_main_notifications";
  }
}

function readAll() {
  try {
    const raw = localStorage.getItem(key());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeAll(items) {
  try {
    localStorage.setItem(key(), JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch (e) {
    // ignore quota errors
  }
  try {
    window.dispatchEvent(new CustomEvent("aflixs:notifications-changed"));
  } catch (e) {
    // ignore
  }
}

export function getNotifications() {
  return readAll().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function getUnreadCount() {
  return readAll().filter((n) => !n.read).length;
}

// Merge trending titles into a "new releases" digest, skipping known ids.
export function pushTrendingDigest(titles) {
  if (!Array.isArray(titles) || titles.length === 0) return getNotifications();
  const current = readAll();
  const known = new Set(current.map((n) => String(n.titleId || n.id)));
  const fresh = [];
  titles.slice(0, 8).forEach((t) => {
    if (!t || t.id == null || known.has(String(t.id))) return;
    const name = t.title || t.name || t.original_title || t.original_name || "Untitled";
    fresh.push({
      id: `n${Date.now().toString(36)}${t.id}`,
      titleId: t.id,
      media_type: t.media_type || "movie",
      headline: `New trending: ${name}`,
      body: t.overview ? String(t.overview).slice(0, 120) : "Now trending on Aflixs.",
      poster_path: t.poster_path || null,
      createdAt: Date.now(),
      read: false,
      payload: { id: t.id, media_type: t.media_type || "movie" },
    });
  });
  if (fresh.length === 0) return getNotifications();
  writeAll([...fresh, ...current]);
  return getNotifications();
}

export function markAllRead() {
  writeAll(readAll().map((n) => ({ ...n, read: true })));
  return getNotifications();
}

export function markRead(id) {
  writeAll(readAll().map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n)));
  return getNotifications();
}

export function clearNotifications() {
  writeAll([]);
  return [];
}

export function onNotificationsChanged(cb) {
  window.addEventListener("aflixs:notifications-changed", cb);
  window.addEventListener("aflixs:profile-switched", cb);
  return () => {
    window.removeEventListener("aflixs:notifications-changed", cb);
    window.removeEventListener("aflixs:profile-switched", cb);
  };
}
