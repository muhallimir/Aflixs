import React, { useCallback, useEffect, useState } from "react";
import axios from "./axios";
import { TMDB_API_KEY } from "./request";
import {
  getNotifications,
  getUnreadCount,
  pushTrendingDigest,
  markAllRead,
  markRead,
  clearNotifications,
  onNotificationsChanged,
} from "./utils/notifications";
import { isDemoMode, getMockCatalog } from "./utils/mockCatalog";
import "./NotificationsBell.css";

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(() => {
    try {
      return getNotifications();
    } catch (e) {
      return [];
    }
  });
  const [unread, setUnread] = useState(() => {
    try {
      return getUnreadCount();
    } catch (e) {
      return 0;
    }
  });

  const refresh = useCallback(() => {
    try {
      setItems(getNotifications());
      setUnread(getUnreadCount());
    } catch (e) {
      // ignore
    }
  }, []);

  const pullDigest = useCallback(async () => {
    try {
      if (isDemoMode()) {
        pushTrendingDigest(getMockCatalog().slice(0, 5));
        return;
      }
      const res = await axios.get(
        `/trending/all/week?api_key=${TMDB_API_KEY}&language=en-US`
      );
      pushTrendingDigest(res.data.results || []);
    } catch (e) {
      // Digest is best-effort; bell still shows stored items.
    }
  }, []);

  useEffect(() => {
    refresh();
    pullDigest();
    let off = () => {};
    try {
      off = onNotificationsChanged(refresh);
    } catch (e) {
      // ignore
    }
    return off;
  }, [refresh, pullDigest]);

  const openTitle = (n) => {
    try {
      markRead(n.id);
    } catch (e) {
      // ignore
    }
    refresh();
    setOpen(false);
    try {
      const payload = n.payload || { id: n.titleId, media_type: n.media_type };
      window.dispatchEvent(new CustomEvent("aflixs:open-title", { detail: payload }));
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="notifBell">
      <button
        type="button"
        className="notifBell__btn"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {"\uD83D\uDD14"}
        {unread > 0 && (
          <span className="notifBell__dot" aria-hidden="true">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="notifBell__panel" role="dialog" aria-label="Notifications">
          <div className="notifBell__head">
            <strong>New releases</strong>
            <button
              type="button"
              onClick={() => {
                try {
                  markAllRead();
                } catch (e) {
                  // ignore
                }
                refresh();
              }}
              disabled={unread === 0}
            >
              Mark read
            </button>
          </div>
          {items.length === 0 ? (
            <p className="notifBell__empty">You are all caught up. Check back for trending drops.</p>
          ) : (
            <ul className="notifBell__list">
              {items.slice(0, 10).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`notifBell__item ${n.read ? "" : "unread"}`}
                    onClick={() => openTitle(n)}
                  >
                    <span className="notifBell__headline">{n.headline}</span>
                    <span className="notifBell__body">{n.body}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="notifBell__foot">
            <button type="button" onClick={pullDigest}>
              Refresh digest
            </button>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  try {
                    clearNotifications();
                  } catch (e) {
                    // ignore
                  }
                  refresh();
                }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsBell;
