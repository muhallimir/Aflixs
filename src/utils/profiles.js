// Multi-profile support (local only, up to 4 profiles).
// Per-profile namespacing for My List, continue-watching, ratings, etc.
// No new dependencies. Emits "aflixs:profiles-changed" on changes.

const PROFILES_KEY = "aflixs_profiles";
const ACTIVE_KEY = "aflixs_active_profile";
export const MAX_PROFILES = 4;

const AVATAR_COLORS = ["#e50914", "#0071eb", "#46d369", "#ffb400"];

function emit() {
  try {
    window.dispatchEvent(new CustomEvent("aflixs:profiles-changed"));
  } catch (e) {
    // ignore (non-browser)
  }
}

function readProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // fall through to default
  }
  return [{ id: "main", name: "Main", color: AVATAR_COLORS[0], createdAt: Date.now() }];
}

function writeProfiles(profiles) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles.slice(0, MAX_PROFILES)));
  } catch (e) {
    // ignore quota errors
  }
  emit();
}

export function getProfiles() {
  return readProfiles();
}

export function getActiveProfileId() {
  try {
    const id = localStorage.getItem(ACTIVE_KEY);
    if (id && readProfiles().some((p) => p.id === id)) return id;
  } catch (e) {
    // ignore
  }
  return readProfiles()[0].id;
}

export function getActiveProfile() {
  const id = getActiveProfileId();
  return readProfiles().find((p) => p.id === id) || readProfiles()[0];
}

export function createProfile(name) {
  const profiles = readProfiles();
  if (profiles.length >= MAX_PROFILES) return profiles;
  const clean = String(name || "").trim().slice(0, 16) || `Profile ${profiles.length + 1}`;
  const profile = {
    id: `p${Date.now().toString(36)}`,
    name: clean,
    color: AVATAR_COLORS[profiles.length % AVATAR_COLORS.length],
    createdAt: Date.now(),
  };
  writeProfiles([...profiles, profile]);
  return readProfiles();
}

export function renameProfile(id, name) {
  const clean = String(name || "").trim().slice(0, 16);
  if (!clean) return readProfiles();
  writeProfiles(readProfiles().map((p) => (p.id === id ? { ...p, name: clean } : p)));
  return readProfiles();
}

export function deleteProfile(id) {
  const profiles = readProfiles();
  if (profiles.length <= 1) return profiles;
  const next = profiles.filter((p) => p.id !== id);
  writeProfiles(next);
  if (getActiveProfileId() === id) {
    try {
      localStorage.setItem(ACTIVE_KEY, next[0].id);
    } catch (e) {
      // ignore
    }
    emit();
  }
  return next;
}

export function switchProfile(id) {
  if (!readProfiles().some((p) => p.id === id)) return getActiveProfileId();
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch (e) {
    // ignore
  }
  emit();
  try {
    window.dispatchEvent(new CustomEvent("aflixs:profile-switched", { detail: { id } }));
  } catch (e) {
    // ignore
  }
  return id;
}

// Namespace a storage key per active profile.
export function ns(key) {
  return `aflixs_${getActiveProfileId()}_${key}`;
}

export function onProfilesChanged(cb) {
  window.addEventListener("aflixs:profiles-changed", cb);
  window.addEventListener("aflixs:profile-switched", cb);
  return () => {
    window.removeEventListener("aflixs:profiles-changed", cb);
    window.removeEventListener("aflixs:profile-switched", cb);
  };
}
