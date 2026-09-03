// User star ratings (1-5 per title, per-profile localStorage).
// Emits "aflixs:ratings-changed" on changes.

import { ns } from "./profiles";

function key() {
  try {
    return ns("ratings");
  } catch (e) {
    return "aflixs_main_ratings";
  }
}

function readAll() {
  try {
    const raw = localStorage.getItem(key());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

function writeAll(map) {
  try {
    localStorage.setItem(key(), JSON.stringify(map));
  } catch (e) {
    // ignore quota errors
  }
  try {
    window.dispatchEvent(new CustomEvent("aflixs:ratings-changed"));
  } catch (e) {
    // ignore
  }
}

export function getRatings() {
  return readAll();
}

export function getRating(id) {
  if (id == null) return 0;
  const v = readAll()[String(id)];
  return typeof v === "number" ? v : 0;
}

export function setRating(id, stars) {
  if (id == null) return readAll();
  const map = readAll();
  const n = Math.max(1, Math.min(5, Number(stars) || 0));
  if (!n) {
    delete map[String(id)];
  } else {
    map[String(id)] = n;
  }
  writeAll(map);
  return map;
}

export function removeRating(id) {
  const map = readAll();
  delete map[String(id)];
  writeAll(map);
  return map;
}

export function clearRatings() {
  writeAll({});
  return {};
}

export function onRatingsChanged(cb) {
  window.addEventListener("aflixs:ratings-changed", cb);
  window.addEventListener("aflixs:profile-switched", cb);
  return () => {
    window.removeEventListener("aflixs:ratings-changed", cb);
    window.removeEventListener("aflixs:profile-switched", cb);
  };
}
