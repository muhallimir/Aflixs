import { diff } from "../utils/compare";

describe("compare.diff", () => {
  test("returns the expected fields and overall winner", () => {
    const a = { id: 1, title: "A", vote_average: 8.1, release_date: "2024-01-01", runtime: 120, popularity: 50, genre_ids: [28, 12] };
    const b = { id: 2, title: "B", vote_average: 7.4, release_date: "2023-05-01", runtime: 95, popularity: 30, genre_ids: [18] };
    const out = diff(a, b);
    const fields = Object.fromEntries(out.fields.map((f) => [f.key, f]));
    expect(fields.rating.winner).toBe("a");
    expect(fields.year.winner).toBe("a");
    expect(fields.runtime.winner).toBe("a");
    expect(fields.popularity.winner).toBe("a");
    expect(["a", "tie"]).toContain(fields.genres.winner);
    expect(out.overall).toBe("a");
    expect(out.tally.a).toBeGreaterThanOrEqual(4);
  });

  test("ties resolve to overall=tie", () => {
    const a = { id: 1, vote_average: 7, release_date: "2022-01-01", runtime: 100, popularity: 10, genre_ids: [18] };
    const b = { id: 2, vote_average: 7, release_date: "2022-01-01", runtime: 100, popularity: 10, genre_ids: [18] };
    const out = diff(a, b);
    expect(out.overall).toBe("tie");
    out.fields.forEach((f) => expect(f.winner).toBe("tie"));
  });

  test("later year wins even with missing year on the other", () => {
    const a = { id: 1, vote_average: 0, release_date: "2024-01-01", runtime: 0, popularity: 0, genre_ids: [] };
    const b = { id: 2, vote_average: 0, release_date: "", runtime: 0, popularity: 0, genre_ids: [] };
    const out = diff(a, b);
    expect(out.fields.find((f) => f.key === "year").winner).toBe("a");
  });
});
