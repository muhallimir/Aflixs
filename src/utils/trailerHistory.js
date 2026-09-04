// Trailer watch history (per-profile, last 12). Captures trailers that
// the user opened in the detail modal, deduped by title id, so the Home
// rail can surface "Recently watched trailers".

import { ns } from "./profiles";

const MAX_ITEMS = 12;

function key() {
  try {
    return ns("trailer_history");
  } catch (e) {
    return "aflixs_main_trailer_history";
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
    // ignore quota
  }
  try {
    window.dispatchEvent(new CustomEvent("aflixs:trailer-history-changed"));
  } catch (e) {
    // ignore
  }
}

function slim(movie) {
  if (!movie || movie.id == null) return null;
  return {
    id: movie.id,
    media_type: movie.media_type || (movie.first_air_date && !movie.release_date ? "tv" : "movie"),
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
    watchedAt: Date.now(),
  };
}

export function getTrailerHistory() {
  return readAll().sort((a, b) => (b.watchedAt || 0) - (a.watchedAt || 0));
}

export function recordTrailerWatch(movie) {
  const entry = slim(movie);
  if (!entry) return getTrailerHistory();
  const rest = readAll().filter((i) => String(i.id) !== String(entry.id));
  const next = [entry, ...rest].slice(0, MAX_ITEMS);
  writeAll(next);
  return next;
}

export function removeTrailerWatch(id) {
  const next = readAll().filter((i) => String(i.id) !== String(id));
  writeAll(next);
  return next;
}

export function clearTrailerHistory() {
  writeAll([]);
  return [];
}

export function onTrailerHistoryChanged(cb) {
  const handler = () => {
    try {
      cb(getTrailerHistory());
    } catch (e) {
      // ignore
    }
  };
  window.addEventListener("aflixs:trailer-history-changed", handler);
  window.addEventListener("aflixs:profile-switched", handler);
  return () => {
    window.removeEventListener("aflixs:trailer-history-changed", handler);
    window.removeEventListener("aflixs:profile-switched", handler);
  };
}
