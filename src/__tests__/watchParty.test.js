// Tests for the watch-party pure logic (room ids, invite URLs, recent rooms).
// The BroadcastChannel-based joinRoom() is exercised in browser only; jsdom
// does not implement BroadcastChannel, so we guard behind typeof checks.

import {
  buildRoomId,
  buildInviteUrl,
  readRoomFromUrl,
  getRecentRooms,
  rememberRoom,
  clearRecentRooms,
  onWatchPartyRoomsChanged,
} from "../utils/watchParty";
import * as profiles from "../utils/profiles";

describe("watchParty helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    profiles.switchProfile("p_wp");
    delete window.location;
    window.location = { href: "http://localhost/?foo=bar", search: "?foo=bar" };
  });

  test("buildRoomId returns a stable type-id string", () => {
    expect(buildRoomId({ id: 7, media_type: "movie" })).toBe("movie-7");
    expect(buildRoomId({ id: 9, media_type: "tv" })).toBe("tv-9");
    expect(buildRoomId({ id: 1, first_air_date: "2020", release_date: "" })).toBe("tv-1");
    expect(buildRoomId({})).toBeNull();
  });

  test("buildInviteUrl embeds ?room=<id>", () => {
    window.location.href = "http://localhost/?title=movie-1";
    expect(buildInviteUrl("movie-1")).toBe("http://localhost/?title=movie-1&room=movie-1");
    expect(buildInviteUrl(null)).toBeNull();
  });

  test("readRoomFromUrl parses the room query param", () => {
    window.location.search = "?room=movie-42";
    expect(readRoomFromUrl()).toBe("movie-42");
    window.location.search = "";
    expect(readRoomFromUrl()).toBeNull();
  });

  test("rememberRoom dedupes and caps at 8 recent rooms", () => {
    const title = { id: 1, title: "Neon Harbor", media_type: "movie" };
    for (let i = 0; i < 10; i++) {
      rememberRoom(`movie-${i}`, { ...title, id: i, title: `T${i}` });
    }
    const rooms = getRecentRooms();
    expect(rooms.length).toBe(8);
    expect(rooms[0].roomId).toBe("movie-9");
    // Re-adding an existing room moves it to the top instead of duplicating.
    rememberRoom("movie-3", { ...title, id: 3, title: "T3" });
    const after = getRecentRooms();
    expect(after[0].roomId).toBe("movie-3");
    expect(after.filter((r) => r.roomId === "movie-3").length).toBe(1);
  });

  test("clearRecentRooms empties storage and emits change event", () => {
    rememberRoom("movie-1", { id: 1, title: "T", media_type: "movie" });
    const cb = jest.fn();
    const off = onWatchPartyRoomsChanged(cb);
    clearRecentRooms();
    expect(getRecentRooms()).toEqual([]);
    expect(cb).toHaveBeenCalled();
    off();
  });

  test("rememberRoom ignores invalid input", () => {
    rememberRoom(null, { id: 1, title: "T" });
    expect(getRecentRooms()).toEqual([]);
  });
});
