// Demo-mode mock catalog: used when REACT_APP_TMDB_API_KEY is missing.
// Clearly labeled demo data so the app stays client-presentable offline.

export function isDemoMode() {
  return !process.env.REACT_APP_TMDB_API_KEY;
}

const TITLES = [
  ["Neon Harbor", "A detective chases a signal through a flooded neon city.", 8.1, "2024", [28, 878]],
  ["Paper Moons", "Two estranged siblings reunite on a cross-country road trip.", 7.4, "2023", [18, 10751]],
  ["Orbit Kids", "A crew of young cadets saves a drifting space station.", 8.6, "2024", [16, 10751, 12]],
  ["The Last Reel", "A projectionist discovers a film that predicts tomorrow.", 7.9, "2022", [9648, 18]],
  ["Comet Chasers", "Amateur astronomers race to name a once-a-century comet.", 7.1, "2023", [35, 12]],
  ["Silent Summit", "Climbers face a storm and a secret on an unclimbed peak.", 7.7, "2021", [12, 53]],
  ["Bakery at Dawn", "A night-shift baker rebuilds her shop after a fire.", 6.9, "2022", [35, 10751]],
  ["Deep Field", "A deep-sea crew finds light where none should exist.", 8.3, "2024", [878, 53]],
  ["Foxglove Lane", "A cozy mystery in a village that forgets every winter.", 7.5, "2023", [9648, 10751]],
  ["Starlight Parade", "An animated marching band tours the constellations.", 8.8, "2024", [16, 14]],
  ["Half Court", "An underdog team gets one last shot at the finals.", 7.2, "2021", [18]],
  ["Midnight Ramen", "A late-night food stall mends a busy city, one bowl at a time.", 8.0, "2023", [18, 35]],
];

const COLORS = ["#7c3aed", "#0ea5e9", "#e50914", "#16a34a", "#f59e0b", "#ec4899"];

export function getMockCatalog() {
  return TITLES.map(([title, overview, vote_average, release_date, genre_ids], i) => ({
    id: 900000 + i,
    media_type: "movie",
    title,
    overview,
    vote_average,
    release_date,
    first_air_date: "",
    poster_path: null,
    backdrop_path: null,
    genre_ids,
    adult: false,
    mockColor: COLORS[i % COLORS.length],
    mockDemo: true,
  }));
}
