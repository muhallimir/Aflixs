import React, { useCallback, useEffect, useState } from "react";
import {
  getRecentlyViewed,
  clearRecentlyViewed,
  onRecentlyViewedChanged,
} from "./utils/recentlyViewed";
import "./RecentlyViewedRail.css";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

function labelOf(m) {
  return m?.title || m?.name || m?.original_title || m?.original_name || "Untitled";
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(ts).toLocaleDateString();
}

function RecentlyViewedRail({ onSelectTitle }) {
  const [items, setItems] = useState(() => {
    try {
      return getRecentlyViewed();
    } catch (e) {
      return [];
    }
  });

  const refresh = useCallback(() => {
    try {
      setItems(getRecentlyViewed());
    } catch (e) {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    refresh();
    let off = () => {};
    try {
      off = onRecentlyViewedChanged(refresh);
    } catch (e) {
      // ignore
    }
    window.addEventListener("focus", refresh);
    return () => {
      off();
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  if (items.length === 0) return null;

  return (
    <section className="recentRail" aria-label="Recently viewed">
      <div className="recentRail__head">
        <h2>Recently Viewed</h2>
        <button
          className="recentRail__clear"
          onClick={() => {
            try {
              clearRecentlyViewed();
            } catch (e) {
              // ignore
            }
            refresh();
          }}
          aria-label="Clear recently viewed"
        >
          Clear
        </button>
      </div>
      <div className="recentRail__track">
        {items.map((m) => {
          const img = m.backdrop_path || m.poster_path;
          return (
            <button
              key={m.id}
              className="recentRail__card"
              onClick={() => onSelectTitle && onSelectTitle(m)}
              aria-label={`View details for ${labelOf(m)}, viewed ${timeAgo(m.viewedAt)}`}
            >
              {img ? (
                <img src={`${IMG_BASE}${img}`} alt={labelOf(m)} loading="lazy" />
              ) : (
                <span className="recentRail__fallback" aria-hidden="true">
                  {labelOf(m).slice(0, 1)}
                </span>
              )}
              <span className="recentRail__name">{labelOf(m)}</span>
              <span className="recentRail__time">{timeAgo(m.viewedAt)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default RecentlyViewedRail;
