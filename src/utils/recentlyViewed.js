// Recently-viewed rail (last 12 opened titles, per-profile).
// Emits "aflixs:recently-viewed-changed" on changes.

import { ns } from "./profiles";

const MAX_ITEMS = 12;

function key() {
  try {
    return ns("recently_viewed");
  } catch (e) {
    return "aflixs_main_recently_viewed";
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
    window.dispatchEvent(new CustomEvent("aflixs:recently-viewed-changed"));
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
    overview: movie.overview || "",
    poster_path: movie.poster_path || null,
    backdrop_path: movie.backdrop_path || null,
    vote_average: movie.vote_average ?? 0,
    release_date: movie.release_date || "",
    first_air_date: movie.first_air_date || "",
    genre_ids: Array.isArray(movie.genre_ids) ? movie.genre_ids.slice(0, 6) : [],
    viewedAt: Date.now(),
  };
}

export function getRecentlyViewed() {
  return readAll().sort((a, b) => (b.viewedAt || 0) - (a.viewedAt || 0));
}

export function recordView(movie) {
  const entry = slim(movie);
  if (!entry) return getRecentlyViewed();
  const rest = readAll().filter((i) => String(i.id) !== String(entry.id));
  const next = [entry, ...rest].slice(0, MAX_ITEMS);
  writeAll(next);
  return next;
}

export function clearRecentlyViewed() {
  writeAll([]);
  return [];
}

export function onRecentlyViewedChanged(cb) {
  window.addEventListener("aflixs:recently-viewed-changed", cb);
  window.addEventListener("aflixs:profile-switched", cb);
  return () => {
    window.removeEventListener("aflixs:recently-viewed-changed", cb);
    window.removeEventListener("aflixs:profile-switched", cb);
  };
}
