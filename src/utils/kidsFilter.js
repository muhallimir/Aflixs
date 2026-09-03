// Kids mode filter (family/animation genres, hides adult-flagged titles).

export const KIDS_GENRE_IDS = [16, 10751, 10762, 14, 12];
export const ADULT_GENRE_IDS = [27, 53, 80, 10749];

export function isKidsSafe(movie) {
  if (!movie) return false;
  if (movie.adult) return false;
  const ids = Array.isArray(movie.genre_ids) ? movie.genre_ids : [];
  if (ids.some((id) => ADULT_GENRE_IDS.includes(id))) return false;
  if (ids.length === 0) return true;
  return ids.some((id) => KIDS_GENRE_IDS.includes(id));
}

export function filterKidsMode(list, kidsMode) {
  if (!kidsMode) return list || [];
  return (list || []).filter(isKidsSafe);
}
