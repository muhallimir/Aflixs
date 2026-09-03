// Maturity badges + content advisories (heuristic, no new deps).
// TMDB list endpoints rarely include certification/runtime, so we derive a
// sensible badge from adult flag, vote average and genre hints.

const GENRE_HINTS = {
  28: "Action violence",
  27: "Horror",
  53: "Thriller",
  80: "Crime",
  10752: "War themes",
  9648: "Mystery",
};

export function getYear(movie) {
  return (movie?.release_date || movie?.first_air_date || "").slice(0, 4);
}

export function getMaturity(movie) {
  if (movie?.adult) return { badge: "18+", level: 3 };
  const ids = Array.isArray(movie?.genre_ids) ? movie.genre_ids : [];
  if (ids.includes(27) || ids.includes(53) || ids.includes(80)) {
    return { badge: "16+", level: 2 };
  }
  if (ids.includes(28) || ids.includes(10752) || ids.includes(9648)) {
    return { badge: "PG-13", level: 1 };
  }
  if (ids.includes(16) || ids.includes(10751) || ids.includes(35)) {
    return { badge: "PG", level: 0 };
  }
  // Fallback by vote count maturity: unknown titles stay family-neutral.
  return { badge: "PG", level: 0 };
}

export function getContentAdvisories(movie) {
  const ids = Array.isArray(movie?.genre_ids) ? movie.genre_ids : [];
  const out = [];
  ids.forEach((id) => {
    if (GENRE_HINTS[id] && !out.includes(GENRE_HINTS[id])) out.push(GENRE_HINTS[id]);
  });
  if (movie?.adult && !out.includes("Adult themes")) out.push("Adult themes");
  return out.slice(0, 3);
}

// True when a title passes the user's maturity prefs.
export function passesMaturity(movie, prefs) {
  if (!prefs) return true;
  if (prefs.kidsMode || prefs.maturityLevel === "kids") {
    if (movie?.adult) return false;
    const ids = Array.isArray(movie?.genre_ids) ? movie.genre_ids : [];
    if (ids.includes(27) || ids.includes(53) || ids.includes(80)) return false;
    if (ids.includes(10749) && movie?.adult) return false;
    return true;
  }
  if (prefs.maturityLevel === "pg") {
    return getMaturity(movie).level <= 1;
  }
  return true;
}
