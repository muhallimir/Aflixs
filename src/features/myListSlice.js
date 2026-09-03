import { createSlice } from "@reduxjs/toolkit";
import { getActiveProfileId } from "../utils/profiles";

const LEGACY_KEY = "aflixs_my_list";

function storageKey() {
  try {
    return `aflixs_${getActiveProfileId()}_my_list`;
  } catch (e) {
    return LEGACY_KEY;
  }
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((item) => item && item.id != null);
    }
    // One-time migration from the pre-profile global key.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) return parsed.filter((item) => item && item.id != null);
    }
    return [];
  } catch (e) {
    return [];
  }
}

function normalizeItem(movie) {
  if (!movie || movie.id == null) return null;
  return {
    id: movie.id,
    media_type: movie.media_type || (movie.first_air_date && !movie.release_date ? "tv" : "movie"),
    title: movie.title || movie.name || movie.original_title || movie.original_name || "Untitled",
    name: movie.name || movie.title || "",
    original_name: movie.original_name || "",
    overview: movie.overview || "",
    poster_path: movie.poster_path || null,
    backdrop_path: movie.backdrop_path || null,
    vote_average: movie.vote_average ?? 0,
    release_date: movie.release_date || "",
    first_air_date: movie.first_air_date || "",
    genre_ids: Array.isArray(movie.genre_ids) ? movie.genre_ids.slice(0, 6) : [],
    adult: Boolean(movie.adult),
  };
}

function persist(list) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(list));
  } catch (e) {
    // Storage may be unavailable (private mode); watchlist still works in memory.
  }
}

// Reload items for the active profile (call after profile switch).
export function loadListForProfile() {
  return loadInitial();
}

export const myListSlice = createSlice({
  name: "myList",
  initialState: {
    items: loadInitial(),
  },
  reducers: {
    addToList: (state, action) => {
      const item = normalizeItem(action.payload);
      if (!item) return;
      const exists = state.items.some((i) => String(i.id) === String(item.id));
      if (!exists) {
        state.items.push(item);
        persist(state.items);
      }
    },
    removeFromList: (state, action) => {
      const id = action.payload && action.payload.id != null ? action.payload.id : action.payload;
      state.items = state.items.filter((i) => String(i.id) !== String(id));
      persist(state.items);
    },
    toggleListItem: (state, action) => {
      const item = normalizeItem(action.payload);
      if (!item) return;
      const exists = state.items.some((i) => String(i.id) === String(item.id));
      if (exists) {
        state.items = state.items.filter((i) => String(i.id) !== String(item.id));
      } else {
        state.items.push(item);
      }
      persist(state.items);
    },
    clearList: (state) => {
      state.items = [];
      persist(state.items);
    },
    setList: (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : [];
    },
  },
});

export const { addToList, removeFromList, toggleListItem, clearList, setList } = myListSlice.actions;

export const selectMyList = (state) => state.myList.items;
export const selectMyListCount = (state) => state.myList.items.length;
export const selectIsInList = (state, id) =>
  state.myList.items.some((i) => String(i.id) === String(id));

export default myListSlice.reducer;
