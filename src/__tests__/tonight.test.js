// Tests for the Tonight rail selector.

import { pickTonight, explainRule, TONIGHT_LIMIT, dayKey } from "../utils/tonight";

const m = (id, title = "T" + id, opts = {}) => ({
  id,
  title,
  name: title,
  poster_path: "/p.jpg",
  backdrop_path: "/b.jpg",
  vote_average: 7,
  release_date: "2024-01-01",
  first_air_date: "",
  overview: "",
  genre_ids: [28],
  media_type: opts.media_type || "movie",
});

describe("tonight selector", () => {
  test("TONIGHT_LIMIT is 6", () => {
    expect(TONIGHT_LIMIT).toBe(6);
  });

  test("dayKey returns YYYY-M-D", () => {
    expect(dayKey()).toMatch(/^\d{4}-\d{1,2}-\d{1,2}$/);
  });

  test("returns up to TONIGHT_LIMIT unique picks with rules", () => {
    const myList = [m(1, "Mine A"), m(2, "Mine B"), m(3, "Mine C")];
    const trending = [m(4, "Trend A"), m(5, "Trend B"), m(6, "Trend C")];
    const recent = [m(7, "Recent A"), m(8, "Recent B")];
    const picks = pickTonight({ myList, trending, recentlyViewed: recent });
    expect(picks.length).toBeLessThanOrEqual(TONIGHT_LIMIT);
    const ids = picks.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    picks.forEach((p) => {
      expect(typeof p.rule).toBe("string");
      expect(p.rule.length).toBeGreaterThan(0);
      expect(p.source).toMatch(/mylist|trending|recent|filler/);
    });
  });

  test("returns 2 from My List when My List has enough titles", () => {
    const myList = [m(1), m(2), m(3), m(4)];
    const picks = pickTonight({ myList, trending: [], recentlyViewed: [] });
    const fromMyList = picks.filter((p) => p.source === "mylist");
    expect(fromMyList.length).toBe(2);
  });

  test("fills remainder from any pool when sources are short", () => {
    const myList = [m(1)];
    const trending = [m(2), m(3), m(4), m(5), m(6)];
    const recent = [];
    const picks = pickTonight({ myList, trending, recentlyViewed: recent });
    expect(picks.length).toBe(6);
    expect(picks.some((p) => p.source === "filler" || p.source === "trending")).toBe(true);
  });

  test("explainRule returns the rule or a generic fallback", () => {
    expect(explainRule("Trending now.")).toBe("Trending now.");
    expect(explainRule()).toBe("Curated for you.");
    expect(explainRule("")).toBe("Curated for you.");
  });

  test("same inputs same day yield the same picks (deterministic)", () => {
    const myList = [m(1), m(2), m(3)];
    const trending = [m(4), m(5), m(6)];
    const recent = [m(7), m(8)];
    const a = pickTonight({ myList, trending, recentlyViewed: recent });
    const b = pickTonight({ myList, trending, recentlyViewed: recent });
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
    expect(a.map((p) => p.source)).toEqual(b.map((p) => p.source));
  });

  test("empty inputs return an empty array without throwing", () => {
    expect(pickTonight({ myList: [], trending: [], recentlyViewed: [] })).toEqual([]);
    expect(pickTonight({})).toEqual([]);
    expect(pickTonight({ myList: null, trending: undefined, recentlyViewed: [] })).toEqual([]);
  });
});
