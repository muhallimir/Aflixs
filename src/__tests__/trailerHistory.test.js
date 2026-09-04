// Tests for trailer history pure logic.

import {
  getTrailerHistory,
  recordTrailerWatch,
  removeTrailerWatch,
  clearTrailerHistory,
  onTrailerHistoryChanged,
} from "../utils/trailerHistory";
import * as profiles from "../utils/profiles";

describe("trailer history utils", () => {
  beforeEach(() => {
    localStorage.clear();
    profiles.switchProfile("p_th");
  });

  const m = (id, title = "T" + id) => ({
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
    media_type: "movie",
  });

  test("empty by default", () => {
    expect(getTrailerHistory()).toEqual([]);
  });

  test("recordTrailerWatch dedupes by id and bumps to the front", () => {
    recordTrailerWatch(m(1, "A"));
    recordTrailerWatch(m(2, "B"));
    recordTrailerWatch(m(1, "A"));
    const all = getTrailerHistory();
    expect(all.length).toBe(2);
    expect(all[0].id).toBe(1);
    expect(all[1].id).toBe(2);
  });

  test("removeTrailerWatch deletes by id", () => {
    recordTrailerWatch(m(1, "A"));
    recordTrailerWatch(m(2, "B"));
    removeTrailerWatch(1);
    expect(getTrailerHistory().map((x) => x.id)).toEqual([2]);
  });

  test("clearTrailerHistory empties the list and emits change", () => {
    recordTrailerWatch(m(1, "A"));
    const cb = jest.fn();
    const off = onTrailerHistoryChanged(cb);
    clearTrailerHistory();
    expect(getTrailerHistory()).toEqual([]);
    expect(cb).toHaveBeenCalled();
    off();
  });

  test("recordTrailerWatch is a no-op for items without an id", () => {
    const before = getTrailerHistory().length;
    const after = recordTrailerWatch({ title: "Nameless" });
    expect(after.length).toBe(before);
  });
});
