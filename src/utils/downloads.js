// Offline downloads mock (per-profile, quota of 5).
// Emits "aflixs:downloads-changed" on changes.

import { ns } from "./profiles";

export const DOWNLOAD_QUOTA = 5;

function key() {
  try {
    return ns("downloads");
  } catch (e) {
    return "aflixs_main_downloads";
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
    localStorage.setItem(key(), JSON.stringify(items.slice(0, DOWNLOAD_QUOTA)));
  } catch (e) {
    // ignore quota errors
  }
  try {
    window.dispatchEvent(new CustomEvent("aflixs:downloads-changed"));
  } catch (e) {
    // ignore
  }
}

function slim(movie) {
  if (!movie || movie.id == null) return null;
  return {
    id: movie.id,
    media_type: movie.media_type || "movie",
    title:
      movie.title ||
      movie.name ||
      movie.original_title ||
      movie.original_name ||
      "Untitled",
    poster_path: movie.poster_path || null,
    backdrop_path: movie.backdrop_path || null,
    vote_average: movie.vote_average ?? 0,
    downloadedAt: Date.now(),
  };
}

export function getDownloads() {
  return readAll();
}

export function isDownloaded(id) {
  return readAll().some((d) => String(d.id) === String(id));
}

// Returns { ok, reason } so UI can explain a full quota.
export function addDownload(movie) {
  const entry = slim(movie);
  if (!entry) return { ok: false, reason: "invalid" };
  const current = readAll();
  if (current.some((d) => String(d.id) === String(entry.id))) return { ok: true, reason: "exists" };
  if (current.length >= DOWNLOAD_QUOTA) return { ok: false, reason: "quota" };
  writeAll([entry, ...current]);
  return { ok: true, reason: "added" };
}

export function removeDownload(id) {
  writeAll(readAll().filter((d) => String(d.id) !== String(id)));
  return readAll();
}

export function clearDownloads() {
  writeAll([]);
  return [];
}

export function onDownloadsChanged(cb) {
  window.addEventListener("aflixs:downloads-changed", cb);
  window.addEventListener("aflixs:profile-switched", cb);
  return () => {
    window.removeEventListener("aflixs:downloads-changed", cb);
    window.removeEventListener("aflixs:profile-switched", cb);
  };
}
