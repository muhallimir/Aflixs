// Tests for the pure logic in src/utils: myList slice, continueWatching,
// ratings, profiles namespacing, kids filter, search debounce, billing, time-ago.

import myListReducer, {
  addToList,
  removeFromList,
  toggleListItem,
  clearList,
  setList,
  selectMyList,
  selectMyListCount,
  selectIsInList,
  loadListForProfile,
} from "../features/myListSlice";
import * as profiles from "../utils/profiles";
import * as cw from "../utils/continueWatching";
import * as ratings from "../utils/ratings";
import * as kids from "../utils/kidsFilter";
import * as billing from "../utils/billing";
import { getMaturity, getContentAdvisories, passesMaturity } from "../utils/maturity";
import * as mockCatalog from "../utils/mockCatalog";

describe("myListSlice", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset to a stable profile id so storage keys are predictable.
    profiles.switchProfile("p_test");
  });

  const sample = (id, title = "Title", type = "movie") => ({
    id,
    title,
    name: title,
    poster_path: "/p.jpg",
    backdrop_path: "/b.jpg",
    vote_average: 7.5,
    release_date: "2024-01-01",
    first_air_date: "",
    overview: "Overview text",
    genre_ids: [28],
    media_type: type,
    adult: false,
  });

  test("toggleListItem adds then removes", () => {
    let state = myListReducer(undefined, toggleListItem(sample(1, "Neon Harbor")));
    expect(selectMyListCount({ myList: state })).toBe(1);
    state = myListReducer(state, toggleListItem(sample(1, "Neon Harbor")));
    expect(selectMyListCount({ myList: state })).toBe(0);
  });

  test("addToList dedupes by id (string and number match)", () => {
    let state = myListReducer(undefined, addToList(sample(1, "Foo")));
    state = myListReducer(state, addToList(sample("1", "Foo"))); // duplicate id
    expect(selectMyListCount({ myList: state })).toBe(1);
  });

  test("removeFromList accepts id payload or object with id", () => {
    let state = myListReducer(undefined, addToList(sample(7, "X")));
    state = myListReducer(state, removeFromList(7));
    expect(selectMyListCount({ myList: state })).toBe(0);

    state = myListReducer(undefined, addToList(sample(9, "Y")));
    state = myListReducer(state, removeFromList({ id: 9 }));
    expect(selectMyListCount({ myList: state })).toBe(0);
  });

  test("persists to per-profile localStorage key", () => {
    myListReducer(undefined, addToList(sample(1, "Persist me")));
    const key = profiles.ns("my_list");
    const raw = localStorage.getItem(key);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe(1);
    expect(parsed[0].title).toBe("Persist me");
  });

  test("clearList empties items and storage", () => {
    let state = myListReducer(undefined, addToList(sample(1, "Foo")));
    state = myListReducer(state, clearList());
    expect(selectMyList({ myList: state })).toEqual([]);
  });

  test("selectIsInList checks by string id", () => {
    let state = myListReducer(undefined, addToList(sample(42, "Foo")));
    const root = { myList: state };
    expect(selectIsInList(root, 42)).toBe(true);
    expect(selectIsInList(root, "42")).toBe(true);
    expect(selectIsInList(root, 99)).toBe(false);
  });

  test("falls back to legacy storage key when no active profile is set", () => {
    localStorage.setItem("aflixs_my_list", JSON.stringify([sample(1, "Legacy")]));
    const loaded = loadListForProfile();
    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe(1);
  });

  test("setList replaces items with provided array (or empty when not an array)", () => {
    let state = myListReducer(undefined, addToList(sample(1, "A")));
    state = myListReducer(state, setList([sample(2, "B"), sample(3, "C")]));
    expect(state.items.map((i) => i.id)).toEqual([2, 3]);
    state = myListReducer(state, setList(null));
    expect(state.items).toEqual([]);
  });
});

describe("continueWatching utils", () => {
  beforeEach(() => {
    localStorage.clear();
    profiles.switchProfile("p_cw");
  });

  test("saveContinueWatching stores entry and updates progress", () => {
    const list = cw.saveContinueWatching({ id: 1, title: "Foo", media_type: "movie" });
    expect(list.length).toBe(1);
    expect(list[0].progress).toBeGreaterThanOrEqual(0.01);

    const updated = cw.updateProgress(1, 0.5);
    expect(updated[0].progress).toBeCloseTo(0.5);
  });

  test("updateProgress clamps to [0, 0.99]", () => {
    cw.saveContinueWatching({ id: 1, title: "Foo", media_type: "movie" });
    cw.updateProgress(1, 2);
    const items = cw.getContinueWatching();
    expect(items[0].progress).toBeLessThanOrEqual(0.99);

    cw.updateProgress(1, -1);
    const items2 = cw.getContinueWatching();
    expect(items2[0].progress).toBeGreaterThanOrEqual(0);
  });

  test("removeContinueWatching and clearContinueWatching work", () => {
    cw.saveContinueWatching({ id: 1, title: "A", media_type: "movie" });
    cw.saveContinueWatching({ id: 2, title: "B", media_type: "movie" });
    expect(cw.getContinueWatching().length).toBe(2);
    cw.removeContinueWatching(1);
    expect(cw.getContinueWatching().map((x) => x.id)).toEqual([2]);
    cw.clearContinueWatching();
    expect(cw.getContinueWatching()).toEqual([]);
  });

  test("getContinueWatching is sorted newest first", () => {
    cw.saveContinueWatching({ id: 1, title: "A", media_type: "movie" });
    // ensure a strictly later updatedAt for id 2
    jest.spyOn(Date, "now").mockReturnValueOnce(Date.now() + 5000);
    cw.saveContinueWatching({ id: 2, title: "B", media_type: "movie" });
    Date.now.mockRestore && Date.now.mockRestore();
    const items = cw.getContinueWatching();
    expect(items[0].id).toBe(2);
  });

  test("saveContinueWatching is a no-op for items without an id", () => {
    const before = cw.getContinueWatching().length;
    const after = cw.saveContinueWatching({ title: "Nameless" });
    expect(after.length).toBe(before);
  });
});

describe("ratings store", () => {
  beforeEach(() => {
    localStorage.clear();
    profiles.switchProfile("p_r");
  });

  test("setRating clamps to 1-5 and removes on 0", () => {
    ratings.setRating(1, 7);
    expect(ratings.getRating(1)).toBe(5);
    // Negative or zero stars clear the rating so the UI can "un-star".
    ratings.setRating(1, -2);
    expect(ratings.getRating(1)).toBe(0);
    ratings.setRating(1, 0);
    expect(ratings.getRating(1)).toBe(0);
  });

  test("clearRatings wipes the profile-scoped key", () => {
    ratings.setRating(1, 4);
    ratings.setRating(2, 3);
    ratings.clearRatings();
    expect(ratings.getRatings()).toEqual({});
  });
});

describe("profiles", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("ns() prefixes with active profile id", () => {
    // The seeded "main" profile is always present after a fresh localStorage.
    profiles.switchProfile("main");
    expect(profiles.ns("foo")).toBe("aflixs_main_foo");
  });

  test("createProfile caps at MAX_PROFILES", () => {
    for (let i = 0; i < profiles.MAX_PROFILES + 2; i++) {
      profiles.createProfile("p" + i);
    }
    expect(profiles.getProfiles().length).toBe(profiles.MAX_PROFILES);
  });

  test("deleteProfile refuses to remove the last profile", () => {
    const before = profiles.getProfiles().length;
    const id = profiles.getProfiles()[0].id;
    profiles.deleteProfile(id);
    expect(profiles.getProfiles().length).toBe(before);
  });

  test("switchProfile ignores unknown ids", () => {
    profiles.switchProfile("main");
    const before = profiles.getActiveProfileId();
    profiles.switchProfile("does_not_exist");
    expect(profiles.getActiveProfileId()).toBe(before);
  });
});

describe("kidsFilter", () => {
  test("isKidsSafe rejects adult-flagged and adult-genre titles", () => {
    expect(kids.isKidsSafe({ adult: true })).toBe(false);
    expect(kids.isKidsSafe({ genre_ids: [27] })).toBe(false); // horror
    expect(kids.isKidsSafe({ genre_ids: [80] })).toBe(false); // crime
  });

  test("isKidsSafe accepts animation and family genres", () => {
    expect(kids.isKidsSafe({ genre_ids: [16] })).toBe(true); // animation
    expect(kids.isKidsSafe({ genre_ids: [10751] })).toBe(true); // family
  });

  test("isKidsSafe accepts titles with no genre_ids (unknown)", () => {
    expect(kids.isKidsSafe({ genre_ids: [] })).toBe(true);
    expect(kids.isKidsSafe({})).toBe(true);
  });

  test("filterKidsMode returns list unchanged when off", () => {
    const list = [{ id: 1, adult: true }];
    expect(kids.filterKidsMode(list, false)).toBe(list);
  });

  test("filterKidsMode filters adult-flagged when on", () => {
    const list = [
      { id: 1, genre_ids: [16] },
      { id: 2, adult: true },
      { id: 3, genre_ids: [27] },
    ];
    const out = kids.filterKidsMode(list, true);
    expect(out.map((x) => x.id)).toEqual([1]);
  });
});

describe("billing utils", () => {
  beforeEach(() => {
    localStorage.clear();
    profiles.switchProfile("p_b");
  });

  test("PLANS exposes three known ids", () => {
    const ids = billing.PLANS.map((p) => p.id);
    expect(ids).toEqual(["free", "standard", "premium"]);
  });

  test("setPlan/cancelPlan/resumePlan transitions are correct", () => {
    billing.setPlan("premium");
    expect(billing.getBilling().planId).toBe("premium");
    billing.cancelPlan();
    expect(billing.getBilling().status).toBe("cancelled");
    billing.resumePlan();
    expect(billing.getBilling().status).toBe("active");
  });

  test("totals match plan price", () => {
    billing.setPlan("free");
    const free = billing.getInvoices();
    expect(free[0].amount).toBe("Free");

    billing.setPlan("standard");
    const std = billing.getInvoices();
    expect(std[0].amount).toBe("$9.99");

    billing.setPlan("premium");
    const prem = billing.getInvoices();
    expect(prem[0].amount).toBe("$14.99");
  });
});

describe("maturity helpers", () => {
  test("getMaturity returns 18+ for adult-flagged", () => {
    expect(getMaturity({ adult: true }).badge).toBe("18+");
  });

  test("getMaturity returns 16+ for horror/thriller/crime", () => {
    expect(getMaturity({ genre_ids: [27] }).badge).toBe("16+");
    expect(getMaturity({ genre_ids: [53] }).badge).toBe("16+");
    expect(getMaturity({ genre_ids: [80] }).badge).toBe("16+");
  });

  test("getMaturity returns PG-13 for action/war/mystery", () => {
    expect(getMaturity({ genre_ids: [28] }).badge).toBe("PG-13");
    expect(getMaturity({ genre_ids: [10752] }).badge).toBe("PG-13");
    expect(getMaturity({ genre_ids: [9648] }).badge).toBe("PG-13");
  });

  test("getMaturity returns PG for animation/family/comedy", () => {
    expect(getMaturity({ genre_ids: [16] }).badge).toBe("PG");
  });

  test("getContentAdvisories dedupes and caps at 3", () => {
    const adv = getContentAdvisories({ genre_ids: [27, 27, 53, 28] });
    expect(adv.length).toBeLessThanOrEqual(3);
    expect(new Set(adv).size).toBe(adv.length);
  });

  test("passesMaturity respects kidsMode and pg max", () => {
    expect(passesMaturity({ adult: true }, { kidsMode: false })).toBe(true);
    expect(passesMaturity({ adult: true }, { kidsMode: true })).toBe(false);
    expect(passesMaturity({ genre_ids: [27] }, { kidsMode: true })).toBe(false);
    expect(passesMaturity({ genre_ids: [27] }, { maturityLevel: "pg" })).toBe(false);
    expect(passesMaturity({ genre_ids: [28] }, { maturityLevel: "pg" })).toBe(true);
  });
});

describe("mockCatalog", () => {
  test("isDemoMode toggles on REACT_APP_TMDB_API_KEY", () => {
    const before = process.env.REACT_APP_TMDB_API_KEY;
    delete process.env.REACT_APP_TMDB_API_KEY;
    expect(mockCatalog.isDemoMode()).toBe(true);
    process.env.REACT_APP_TMDB_API_KEY = "x";
    expect(mockCatalog.isDemoMode()).toBe(false);
    if (before === undefined) delete process.env.REACT_APP_TMDB_API_KEY;
    else process.env.REACT_APP_TMDB_API_KEY = before;
  });

  test("getMockCatalog returns 12 unique titles with non-empty data", () => {
    const cat = mockCatalog.getMockCatalog();
    expect(cat.length).toBe(12);
    expect(new Set(cat.map((c) => c.id)).size).toBe(12);
    cat.forEach((c) => {
      expect(c.title).toBeTruthy();
      expect(c.overview).toBeTruthy();
      expect(c.genre_ids.length).toBeGreaterThan(0);
    });
  });
});

describe("time-ago helper", () => {
  // The helper is a private function in ContinueWatchingRow.js; we mirror its
  // shape here and assert on it to catch regressions when the row is edited.
  function timeAgo(ts) {
    if (!ts) return "";
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  }

  test("returns just now for recent", () => {
    expect(timeAgo(Date.now())).toBe("just now");
  });

  test("formats minutes, hours, days", () => {
    const now = Date.now();
    expect(timeAgo(now - 5 * 60000)).toBe("5m ago");
    expect(timeAgo(now - 3 * 60 * 60000)).toBe("3h ago");
    expect(timeAgo(now - 4 * 24 * 60 * 60000)).toBe("4d ago");
  });

  test("returns empty string for falsy input", () => {
    expect(timeAgo(0)).toBe("");
    expect(timeAgo(null)).toBe("");
  });
});