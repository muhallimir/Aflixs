import React, { useEffect, useRef, useState } from "react";
import {
  avatarInitials,
  buildInviteUrl,
  buildRoomId,
  joinRoom,
  readRoomFromUrl,
  rememberRoom,
} from "./utils/watchParty";
import "./WatchPartyPanel.css";

function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

function WatchPartyPanel({ movie, open, onClose }) {
  const [roomId, setRoomId] = useState(() => (movie ? buildRoomId(movie) : null));
  const [snap, setSnap] = useState({ members: [], messages: [], self: null });
  const [chat, setChat] = useState("");
  const [copied, setCopied] = useState(false);
  const [autoJoined, setAutoJoined] = useState(false);
  const sessionRef = useRef(null);
  const listRef = useRef(null);

  // When the modal switches movies, rejoin the new room.
  useEffect(() => {
    if (!open || !movie) return undefined;
    const rid = buildRoomId(movie);
    setRoomId(rid);
    setAutoJoined(false);
    try {
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
    } catch (e) {
      // ignore
    }
    if (!rid) return undefined;
    // Auto-join if the URL carries ?room=<id> and it matches this movie.
    let shouldJoin = false;
    try {
      const urlRoom = readRoomFromUrl();
      if (urlRoom && urlRoom === rid) {
        shouldJoin = true;
        setAutoJoined(true);
      }
    } catch (e) {
      // ignore
    }
    if (!shouldJoin) return undefined;
    const session = joinRoom(rid, { name: makeSelfName() });
    sessionRef.current = session;
    const off = session.onUpdate((s) => setSnap(s));
    try {
      rememberRoom(rid, movie);
    } catch (e) {
      // ignore
    }
    return () => {
      try {
        off();
      } catch (e) {
        // ignore
      }
      try {
        session.close();
      } catch (e) {
        // ignore
      }
      if (sessionRef.current === session) sessionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, movie?.id, movie?.media_type]);

  useEffect(() => {
    return () => {
      try {
        if (sessionRef.current) sessionRef.current.close();
      } catch (e) {
        // ignore
      }
      sessionRef.current = null;
    };
  }, []);

  // Auto-scroll the chat log to the newest message.
  useEffect(() => {
    try {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    } catch (e) {
      // ignore
    }
  }, [snap.messages.length]);

  if (!open || !movie) return null;

  const inviteUrl = buildInviteUrl(roomId);

  const startParty = () => {
    if (!roomId) return;
    try {
      if (sessionRef.current) sessionRef.current.close();
    } catch (e) {
      // ignore
    }
    const session = joinRoom(roomId, { name: makeSelfName() });
    sessionRef.current = session;
    const off = session.onUpdate((s) => setSnap(s));
    try {
      rememberRoom(roomId, movie);
    } catch (e) {
      // ignore
    }
    // Stash the unsubscribe for cleanup on next start.
    sessionRef.current._off = off;
    setAutoJoined(true);
  };

  const leaveParty = () => {
    try {
      if (sessionRef.current) {
        sessionRef.current.leave();
        sessionRef.current.close();
      }
    } catch (e) {
      // ignore
    }
    sessionRef.current = null;
    setSnap({ members: [], messages: [], self: null });
    setAutoJoined(false);
    onClose && onClose();
  };

  const copyInvite = () => {
    if (!inviteUrl) return;
    const done = () => setCopied(true);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(inviteUrl).then(done).catch(() => {
          fallbackCopy(inviteUrl);
          done();
        });
      } else {
        fallbackCopy(inviteUrl);
        done();
      }
    } catch (e) {
      fallbackCopy(inviteUrl);
      done();
    }
    function fallbackCopy(text) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch (err) {
        // ignore
      }
    }
    setTimeout(() => setCopied(false), 1800);
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!sessionRef.current) return;
    const text = chat.trim();
    if (!text) return;
    const ok = sessionRef.current.sendChat(text);
    if (ok) setChat("");
  };

  const titleLabel =
    movie.title || movie.name || movie.original_title || movie.original_name || "this title";
  const inParty = Boolean(sessionRef.current && autoJoined);
  const memberCount = snap.members.length;
  const myId = snap.self && snap.self.id;

  return (
    <div
      className="watchParty__overlay"
      role="dialog"
      aria-label={`Watch party for ${titleLabel}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose && onClose();
      }}
    >
      <div className="watchParty" onClick={(e) => e.stopPropagation()}>
        <header className="watchParty__head">
          <div>
            <strong>Watch party</strong>
            <small>
              Room <code>{roomId || "n/a"}</code> &middot; {titleLabel}
            </small>
          </div>
          <button
            type="button"
            className="watchParty__close"
            onClick={leaveParty}
            aria-label="Leave watch party"
          >
            Leave &amp; close
          </button>
        </header>

        <section className="watchParty__invite" aria-label="Invite link">
          <input
            type="text"
            readOnly
            value={inviteUrl || ""}
            onFocus={(e) => e.target.select()}
            aria-label="Invite link"
          />
          <button type="button" onClick={copyInvite} aria-label="Copy invite link">
            {copied ? "Copied" : "Copy link"}
          </button>
          {!inParty && (
            <button type="button" className="watchParty__start" onClick={startParty}>
              Start party in this tab
            </button>
          )}
        </section>

        {!inParty && (
          <p className="watchParty__hint">
            Open the invite link in another tab (or share it with a friend on this
            device) to chat live across the room. Chat syncs across tabs using
            BroadcastChannel, so no server is needed.
          </p>
        )}

        {inParty && (
          <>
            <section className="watchParty__members" aria-label="Members in this room">
              <h4>In the room ({memberCount})</h4>
              <ul>
                {snap.members.length === 0 && (
                  <li className="watchParty__muted">
                    Waiting for someone to join. Share the invite link.
                  </li>
                )}
                {snap.members.map((m) => (
                  <li
                    key={m.id}
                    className={m.id === myId ? "watchParty__memberSelf" : ""}
                  >
                    <span
                      className="watchParty__avatar"
                      style={{ background: m.color || "#555" }}
                      aria-hidden="true"
                    >
                      {avatarInitials(m.name)}
                    </span>
                    <span className="watchParty__memberName">
                      {m.name || "Anonymous"}
                      {m.id === myId && <em> (you)</em>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="watchParty__chat" aria-label="Chat">
              <div className="watchParty__chatLog" ref={listRef}>
                {snap.messages.length === 0 && (
                  <p className="watchParty__muted">
                    No messages yet. Say hi to your party.
                  </p>
                )}
                {snap.messages.map((m) => {
                  const mine = m.memberId === myId;
                  return (
                    <div
                      key={m.id}
                      className={`watchParty__msg ${mine ? "watchParty__msgMine" : ""}`}
                    >
                      <span
                      className="watchParty__msgAvatar"
                      style={{ background: m.color || "#555" }}
                      aria-hidden="true"
                    >
                      {avatarInitials(m.name)}
                    </span>
                      <div className="watchParty__msgBody">
                        <span className="watchParty__msgHead">
                          <strong>{m.name || "Anonymous"}</strong>
                          <time>{formatTime(m.ts)}</time>
                        </span>
                        <span className="watchParty__msgText">{m.body}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form className="watchParty__chatForm" onSubmit={sendChat}>
                <input
                  type="text"
                  value={chat}
                  onChange={(e) => setChat(e.target.value)}
                  placeholder="Send a message to the room"
                  aria-label="Message"
                  maxLength={280}
                />
                <button type="submit" disabled={!chat.trim()}>
                  Send
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function makeSelfName() {
  try {
    const raw = localStorage.getItem("aflixs_active_profile");
    if (raw) {
      const profiles = JSON.parse(localStorage.getItem("aflixs_profiles") || "[]");
      const p = profiles.find((x) => x.id === raw);
      if (p && p.name) return p.name;
    }
  } catch (e) {
    // ignore
  }
  return "You";
}

export default WatchPartyPanel;
