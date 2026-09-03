// Continue-watching persistence (localStorage, no new dependencies).
// Stored as: [{ id, title, poster_path, backdrop_path, media_type,
//   overview, vote_average, progress (0-1), updatedAt, durationHint }]

const STORAGE_KEY = "aflixs_continue_watching";
const MAX_ITEMS = 20;

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeAll(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch (e) {
    // Ignore quota / private-mode errors.
  }
}

export function getContinueWatching() {
  return readAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function saveContinueWatching(movie, opts = {}) {
  if (!movie || movie.id == null) return getContinueWatching();
  const progress =
    typeof opts.progress === "number"
      ? Math.min(0.99, Math.max(0.01, opts.progress))
      : 0.05;
  const entry = {
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
    progress,
    updatedAt: Date.now(),
  };
  const rest = readAll().filter((i) => String(i.id) !== String(entry.id));
  const next = [entry, ...rest].slice(0, MAX_ITEMS);
  writeAll(next);
  return next;
}

export function updateProgress(id, progress) {
  const items = readAll();
  const next = items.map((i) =>
    String(i.id) === String(id)
      ? {
          ...i,
          progress: Math.min(0.99, Math.max(0, progress)),
          updatedAt: Date.now(),
        }
      : i
  );
  writeAll(next);
  return next;
}

export function removeContinueWatching(id) {
  const next = readAll().filter((i) => String(i.id) !== String(id));
  writeAll(next);
  return next;
}

export function clearContinueWatching() {
  writeAll([]);
  return [];
}
