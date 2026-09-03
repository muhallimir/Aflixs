// "Tonight" personalized rail: pick 6 titles algorithmically from My List,
// Trending, and recently-viewed. Each pick carries a "rule" string so the
// UI can show "Why this?" tooltip. Deterministic per (profile + day) so the
// user sees a fresh lineup each day without rerenders flickering.

export const TONIGHT_LIMIT = 6;

// Deterministic day key (UTC) so the lineup is stable across the day.
export function dayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

// Tiny, dependency-free hash for stable shuffling.
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function labelOf(item) {
  return (
    item?.title ||
    item?.name ||
    item?.original_title ||
    item?.original_name ||
    "Untitled"
  );
}

function slim(item) {
  if (!item || item.id == null) return null;
  return {
    id: item.id,
    media_type: item.media_type || (item.first_air_date && !item.release_date ? "tv" : "movie"),
    title: labelOf(item),
    overview: item.overview || "",
    poster_path: item.poster_path || null,
    backdrop_path: item.backdrop_path || null,
    vote_average: item.vote_average ?? 0,
    release_date: item.release_date || "",
    first_air_date: item.first_air_date || "",
    genre_ids: Array.isArray(item.genre_ids) ? item.genre_ids.slice(0, 6) : [],
    adult: Boolean(item.adult),
  };
}

// Take the first N items from `list` after a per-day shuffle, preserving
// the supplied order when the list is short.
function dailyShuffle(list, salt, limit) {
  if (!Array.isArray(list) || list.length === 0) return [];
  if (list.length <= limit) return list.slice();
  const k = dayKey() + ":" + salt;
  const seed = hash(k);
  const indexed = list.map((item, i) => ({ item, i, r: hash(`${seed}-${i}`) }));
  indexed.sort((a, b) => a.r - b.r);
  return indexed.slice(0, limit).map((x) => x.item);
}

export function pickTonight({ myList = [], trending = [], recentlyViewed = [] } = {}) {
  const myListSafe = Array.isArray(myList) ? myList : [];
  const trendingSafe = Array.isArray(trending) ? trending : [];
  const recentSafe = Array.isArray(recentlyViewed) ? recentlyViewed : [];
  const out = [];
  const seen = new Set();
  function push(item, rule, source) {
    if (!item) return;
    const key = `${source}:${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ ...item, rule, source });
  }

  // 2 picks from My List (rotate daily).
  const myShuffled = dailyShuffle(myListSafe.slice(), "mylist", 2);
  myShuffled.forEach((item) =>
    push(slim(item), "Because it is in your My List.", "mylist")
  );

  // 2 picks from Trending (rotate daily).
  const trendingShuffled = dailyShuffle(trendingSafe.slice(), "trending", 2);
  trendingShuffled.forEach((item) =>
    push(slim(item), "Trending across Aflixs today.", "trending")
  );

  // 2 picks from recently viewed (rotate daily, prefer items not already in).
  const recentShuffled = dailyShuffle(recentSafe.slice(), "recent", 2);
  recentShuffled.forEach((item) =>
    push(slim(item), "You opened this recently.", "recent")
  );

  // Fill the remainder (up to TONIGHT_LIMIT) with anything not yet picked,
  // preferring Trending, then Recently Viewed, then My List. Useful when the
  // user has an empty My List or no recent views.
  const fillers = [
    ...trendingShuffled,
    ...recentShuffled,
    ...myShuffled,
  ];
  for (const item of fillers) {
    if (out.length >= TONIGHT_LIMIT) break;
    push(slim(item), "Picked to round out your night.", "filler");
  }

  return out.slice(0, TONIGHT_LIMIT);
}

export function explainRule(rule) {
  return rule || "Curated for you.";
}
