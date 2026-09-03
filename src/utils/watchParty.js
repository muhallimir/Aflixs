// Watch party (mock): rooms keyed by title id, joined across browser tabs
// of the same origin via the BroadcastChannel API. No server, no new deps.
//
// Storage keys (per profile):
//   aflixs_<profile>_watch_party_rooms  - last 8 rooms joined (id, title, joinedAt)
//
// Channel naming: "aflixs-watch-party:<roomId>"

import { ns } from "./profiles";

const RECENT_LIMIT = 8;
const HEARTBEAT_MS = 5000;
const MEMBER_TTL_MS = 15000;

function recentKey() {
  try {
    return ns("watch_party_rooms");
  } catch (e) {
    return "aflixs_main_watch_party_rooms";
  }
}

export function buildRoomId(title) {
  if (!title || title.id == null) return null;
  let type = title.media_type;
  if (type !== "tv" && type !== "movie") {
    if (title.first_air_date && !title.release_date) type = "tv";
    else if (title.name && !title.title) type = "tv";
    else type = "movie";
  }
  return `${type}-${title.id}`;
}

export function buildInviteUrl(roomId) {
  if (!roomId) return null;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId);
    return url.toString();
  } catch (e) {
    return null;
  }
}

export function readRoomFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("room") || null;
  } catch (e) {
    return null;
  }
}

export function getRecentRooms() {
  try {
    const raw = localStorage.getItem(recentKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeRecentRooms(list) {
  try {
    localStorage.setItem(recentKey(), JSON.stringify(list.slice(0, RECENT_LIMIT)));
  } catch (e) {
    // ignore quota errors
  }
  try {
    window.dispatchEvent(new CustomEvent("aflixs:watch-party-rooms-changed"));
  } catch (e) {
    // ignore
  }
}

export function rememberRoom(roomId, title) {
  if (!roomId) return getRecentRooms();
  const entry = {
    roomId,
    title: title?.title || title?.name || title?.original_title || title?.original_name || "Untitled",
    poster_path: title?.poster_path || null,
    backdrop_path: title?.backdrop_path || null,
    joinedAt: Date.now(),
  };
  const rest = getRecentRooms().filter((r) => r.roomId !== roomId);
  const next = [entry, ...rest].slice(0, RECENT_LIMIT);
  writeRecentRooms(next);
  return next;
}

export function clearRecentRooms() {
  writeRecentRooms([]);
  return [];
}

// ---- Live room session (one tab at a time) ----------------------------------

export function makeMemberId() {
  return `m_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function makeMemberName() {
  // Two friendly words from a small pool; deterministic enough to be a
  // stand-in for a real profile name in a mock demo.
  const a = ["Quick", "Lucky", "Calm", "Wild", "Bold", "Quiet", "Neon", "Bright"];
  const b = ["Otter", "Falcon", "Comet", "Panda", "Heron", "Lynx", "Tiger", "Raven"];
  return `${a[Math.floor(Math.random() * a.length)]} ${b[Math.floor(Math.random() * b.length)]}`;
}

// Exposed so component code and tests share the same initials logic.
export function avatarInitials(name) {
  if (!name) return "?";
  return (
    String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.slice(0, 1).toUpperCase())
      .join("") || "?"
  );
}

function channelName(roomId) {
  return `aflixs-watch-party:${roomId}`;
}

// Open (or rejoin) a room. Returns a session handle with helpers and an
// `onUpdate(cb)` subscriber used by the UI to re-render when peers chat,
// join, leave, or the heartbeat ticks.
export function joinRoom(roomId, opts = {}) {
  if (!roomId || typeof BroadcastChannel === "undefined") {
    return {
      ok: false,
      reason: !roomId ? "no-room" : "unsupported",
      close: () => {},
      sendChat: () => false,
      leave: () => {},
      onUpdate: () => () => {},
      snapshot: () => ({ members: [], messages: [], self: null, roomId }),
    };
  }

  const memberId = opts.memberId || makeMemberId();
  const name = opts.name || makeMemberName();
  const color = pickColor(memberId);
  const now = () => Date.now();

  const members = new Map(); // memberId -> { id, name, color, lastSeen }
  const messages = []; // { id, memberId, name, color, body, ts }
  let self = null;

  const channel = new BroadcastChannel(channelName(roomId));
  const subscribers = new Set();

  const emit = () => {
    const snap = snapshot();
    subscribers.forEach((cb) => {
      try {
        cb(snap);
      } catch (e) {
        // ignore listener errors
      }
    });
  };

  function announceJoin() {
    try {
      channel.postMessage({
        type: "hello",
        member: { id: memberId, name, color, lastSeen: now() },
      });
    } catch (e) {
      // ignore post errors
    }
  }

  function pruneStale() {
    const cutoff = now() - MEMBER_TTL_MS;
    let changed = false;
    for (const [id, m] of members) {
      if (id === memberId) continue;
      if ((m.lastSeen || 0) < cutoff) {
        members.delete(id);
        changed = true;
      }
    }
    return changed;
  }

  // Register self; peers with the same id (rejoin from another tab) should
  // never overwrite each other, so we keep two entries if id collisions
  // happen across browsers, but in a single browser a stable id wins.
  self = { id: memberId, name, color, lastSeen: now() };
  members.set(memberId, self);
  emit();

  // Greet the room; existing tabs reply with "welcome" so newcomers see them.
  announceJoin();

  channel.onmessage = (e) => {
    const data = e.data || {};
    if (!data.type) return;
    if (data.type === "hello") {
      if (data.member && data.member.id && data.member.id !== memberId) {
        members.set(data.member.id, { ...data.member, lastSeen: now() });
      }
      // Reply with a "welcome" so the new tab also sees us.
      try {
        channel.postMessage({
          type: "welcome",
          member: { id: memberId, name, color, lastSeen: now() },
        });
      } catch (err) {
        // ignore
      }
      emit();
      return;
    }
    if (data.type === "welcome") {
      if (data.member && data.member.id && data.member.id !== memberId) {
        members.set(data.member.id, { ...data.member, lastSeen: now() });
        emit();
      }
      return;
    }
    if (data.type === "chat") {
      if (!data.body || !data.member) return;
      messages.push({
        id: `msg_${now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        memberId: data.member.id,
        name: data.member.name,
        color: data.member.color,
        body: String(data.body).slice(0, 280),
        ts: data.ts || now(),
      });
      if (messages.length > 80) messages.splice(0, messages.length - 80);
      // Refresh the sender's heartbeat so chat keeps their dot green.
      members.set(data.member.id, {
        id: data.member.id,
        name: data.member.name,
        color: data.member.color,
        lastSeen: now(),
      });
      emit();
      return;
    }
    if (data.type === "bye") {
      if (data.memberId) {
        members.delete(data.memberId);
        emit();
      }
      return;
    }
  };

  const heartbeat = setInterval(() => {
    if (pruneStale()) emit();
    try {
      channel.postMessage({
        type: "hello",
        member: { id: memberId, name, color, lastSeen: now() },
      });
    } catch (err) {
      // ignore
    }
  }, HEARTBEAT_MS);

  function snapshot() {
    const list = Array.from(members.values()).sort((a, b) => {
      if (a.id === memberId) return -1;
      if (b.id === memberId) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
    return {
      roomId,
      self,
      members: list,
      messages: messages.slice(),
    };
  }

  function onUpdate(cb) {
    subscribers.add(cb);
    try {
      cb(snapshot());
    } catch (e) {
      // ignore
    }
    return () => subscribers.delete(cb);
  }

  function sendChat(body) {
    const text = String(body || "").trim().slice(0, 280);
    if (!text) return false;
    try {
      channel.postMessage({
        type: "chat",
        member: { id: memberId, name, color },
        body: text,
        ts: now(),
      });
      // Local echo so the sender sees their own message immediately.
      messages.push({
        id: `msg_${now().toString(36)}local`,
        memberId,
        name,
        color,
        body: text,
        ts: now(),
      });
      if (messages.length > 80) messages.splice(0, messages.length - 80);
      emit();
      return true;
    } catch (e) {
      return false;
    }
  }

  function leave() {
    try {
      channel.postMessage({ type: "bye", memberId });
    } catch (e) {
      // ignore
    }
  }

  function close() {
    try {
      leave();
    } catch (e) {
      // ignore
    }
    try {
      clearInterval(heartbeat);
    } catch (e) {
      // ignore
    }
    try {
      channel.close();
    } catch (e) {
      // ignore
    }
    subscribers.clear();
  }

  return {
    ok: true,
    reason: "joined",
    memberId,
    name,
    color,
    close,
    leave,
    sendChat,
    onUpdate,
    snapshot,
  };
}

// Deterministic color picker so the same member id renders the same color
// across tabs; keeps the chat avatar palette consistent.
function pickColor(seed) {
  const palette = ["#e50914", "#0071eb", "#46d369", "#ffb400", "#a855f7", "#0ea5e9", "#f97316", "#ec4899"];
  let h = 0;
  const s = String(seed || "x");
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return palette[h % palette.length];
}

export function onWatchPartyRoomsChanged(cb) {
  const handler = () => {
    try {
      cb(getRecentRooms());
    } catch (e) {
      // ignore
    }
  };
  window.addEventListener("aflixs:watch-party-rooms-changed", handler);
  window.addEventListener("aflixs:profile-switched", handler);
  return () => {
    window.removeEventListener("aflixs:watch-party-rooms-changed", handler);
    window.removeEventListener("aflixs:profile-switched", handler);
  };
}
