// Mock soundtrack/songs for the open detail modal. We pull a small set of
// "tracks" per title (3-4) curated by deterministic rules using the title
// id, then expose a YouTube search URL per track so the "Play on YouTube"
// button opens YouTube in a new tab. No API calls.

const ARTISTS = [
  "Hana Mirov",
  "The Quiet Cartographers",
  "Lior Vasquez",
  "Sable & The Coast",
  "Nina Akin",
  "The Velvet Frequency",
  "Marcus Otieno",
  "Echo Caravan",
  "Riya Patel",
  "Tomas Halverson",
];

const MOODS = [
  "Main Theme",
  "Open Credits",
  "Quiet Moments",
  "Closing Theme",
  "Late Night Cue",
  "Sunrise Variation",
  "Storm Interlude",
  "Heartbeat Loop",
];

// Tiny, dependency-free id-hash for stable per-title picks.
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function labelOf(title) {
  return (
    title?.title ||
    title?.name ||
    title?.original_title ||
    title?.original_name ||
    "Untitled"
  );
}

function youtubeSearchUrl(query) {
  const q = String(query || "").trim();
  if (!q) return "https://www.youtube.com/results?search_query=soundtrack";
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

// Returns 3-4 deterministic tracks for a title. Each track has
// { title, artist, duration, searchUrl }.
export function getSoundtrack(movie) {
  if (!movie || movie.id == null) return [];
  const title = labelOf(movie);
  const seed = `${movie.media_type || "movie"}-${movie.id}`;
  const baseHash = hash(seed);
  // Vary the count between 3 and 4 based on the title id.
  const count = baseHash % 7 === 0 ? 4 : 3;
  const tracks = [];
  for (let i = 0; i < count; i++) {
    const h = hash(`${seed}-${i}`);
    const mood = MOODS[h % MOODS.length];
    const artist = ARTISTS[(h >> 3) % ARTISTS.length];
    const mins = 1 + (h % 4);
    const secs = (h >> 5) % 60;
    const duration = `${mins}:${String(secs).padStart(2, "0")}`;
    const trackTitle =
      i === 0 ? `${title} - ${mood}` : `${mood} (${title})`;
    tracks.push({
      id: `t${baseHash.toString(36)}${i}`,
      title: trackTitle,
      artist,
      duration,
      searchUrl: youtubeSearchUrl(`${trackTitle} ${artist} ${title}`),
    });
  }
  return tracks;
}

export function getSoundtrackLabel() {
  return "Curated mock soundtrack; not a real licensed tracklist.";
}
