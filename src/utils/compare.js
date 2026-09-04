// Compare two titles: returns a structured diff with "winners" for each
// numeric field. Pure function, no React/DOM, so it's fully testable.

const HIGHER = ["vote_average", "popularity", "runtime"];
const LOWER = [];

function safe(arr, idx, fallback) {
  return Array.isArray(arr) && arr.length > idx ? arr[idx] : fallback;
}

function genreList(ids, map) {
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => (map && map[id]) || `#${id}`);
}

function diff(a, b, opts = {}) {
  const genreMap = opts.genreMap || {};
  const fields = [
    {
      key: "rating",
      label: "Rating",
      aValue: a.vote_average ?? 0,
      bValue: b.vote_average ?? 0,
      better: "higher",
      format: (v) => `${Number(v || 0).toFixed(1)} / 10`,
    },
    {
      key: "year",
      label: "Year",
      aValue: a.release_date || a.first_air_date || "",
      bValue: b.release_date || b.first_air_date || "",
      better: "later",
      format: (v) => (v ? String(v).slice(0, 4) : "—"),
    },
    {
      key: "runtime",
      label: "Runtime",
      aValue: a.runtime || 0,
      bValue: b.runtime || 0,
      better: "higher",
      format: (v) => (v ? `${v} min` : "—"),
    },
    {
      key: "popularity",
      label: "Popularity",
      aValue: a.popularity || 0,
      bValue: b.popularity || 0,
      better: "higher",
      format: (v) => (v ? Number(v).toFixed(1) : "—"),
    },
    {
      key: "genres",
      label: "Genres",
      aValue: genreList(a.genre_ids, genreMap),
      bValue: genreList(b.genre_ids, genreMap),
      better: "more",
      format: (v) => (Array.isArray(v) ? v.join(", ") || "—" : "—"),
    },
  ];

  const out = fields.map((f) => {
    const aV = f.aValue;
    const bV = f.bValue;
    let winner = "tie";
    if (f.better === "higher" || f.better === "more") {
      if (Number(aV) > Number(bV)) winner = "a";
      else if (Number(bV) > Number(aV)) winner = "b";
    } else if (f.better === "later") {
      const ay = aV ? new Date(aV).getTime() : 0;
      const by = bV ? new Date(bV).getTime() : 0;
      if (ay && by) {
        if (ay > by) winner = "a";
        else if (by > ay) winner = "b";
      } else if (aV) winner = "a";
      else if (bV) winner = "b";
    }
    return {
      key: f.key,
      label: f.label,
      a: f.format(aV),
      b: f.format(bV),
      winner,
    };
  });

  const tally = out.reduce(
    (acc, f) => {
      if (f.winner === "a") acc.a += 1;
      else if (f.winner === "b") acc.b += 1;
      else acc.tie += 1;
      return acc;
    },
    { a: 0, b: 0, tie: 0 }
  );

  let overall = "tie";
  if (tally.a > tally.b) overall = "a";
  else if (tally.b > tally.a) overall = "b";

  return { fields: out, tally, overall };
}

export { diff, HIGHER, LOWER, safe };
