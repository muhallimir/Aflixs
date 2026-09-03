// Tests for the mock soundtrack pure logic.

import { getSoundtrack, getSoundtrackLabel } from "../utils/soundtrack";

describe("soundtrack utils", () => {
  test("returns 3 or 4 tracks per title", () => {
    const tracks = getSoundtrack({ id: 1, title: "Neon Harbor", media_type: "movie" });
    expect(tracks.length === 3 || tracks.length === 4).toBe(true);
    tracks.forEach((t) => {
      expect(t.title).toBeTruthy();
      expect(t.artist).toBeTruthy();
      expect(t.duration).toMatch(/^\d+:\d{2}$/);
      expect(t.searchUrl).toMatch(/^https:\/\/www\.youtube\.com\/results\?search_query=/);
    });
  });

  test("returns an empty list for invalid input", () => {
    expect(getSoundtrack(null)).toEqual([]);
    expect(getSoundtrack({})).toEqual([]);
    expect(getSoundtrack({ id: null })).toEqual([]);
  });

  test("same title yields the same track list (deterministic)", () => {
    const a = getSoundtrack({ id: 42, title: "Orbit Kids", media_type: "movie" });
    const b = getSoundtrack({ id: 42, title: "Orbit Kids", media_type: "movie" });
    expect(a).toEqual(b);
  });

  test("different titles yield different tracks", () => {
    const a = getSoundtrack({ id: 1, title: "Neon Harbor", media_type: "movie" });
    const b = getSoundtrack({ id: 2, title: "Orbit Kids", media_type: "movie" });
    expect(a[0].title).not.toBe(b[0].title);
  });

  test("getSoundtrackLabel returns the curated disclaimer", () => {
    expect(getSoundtrackLabel().toLowerCase()).toContain("curated");
  });
});
