import React, { useCallback, useEffect, useState } from "react";
import {
  getTrailerHistory,
  clearTrailerHistory,
  onTrailerHistoryChanged,
} from "./utils/trailerHistory";
import "./TrailerHistoryRail.css";

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
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function TrailerHistoryRail({ onSelectTitle }) {
  const [items, setItems] = useState(() => {
    try {
      return getTrailerHistory();
    } catch (e) {
      return [];
    }
  });

  const refresh = useCallback(() => {
    try {
      setItems(getTrailerHistory());
    } catch (e) {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    refresh();
    let off = () => {};
    try {
      off = onTrailerHistoryChanged(refresh);
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
    <section className="trailerRail" aria-label="Recently watched trailers">
      <div className="trailerRail__head">
        <h2>Recently watched trailers</h2>
        <button
          className="trailerRail__clear"
          onClick={() => {
            try {
              clearTrailerHistory();
            } catch (e) {
              // ignore
            }
            refresh();
          }}
          aria-label="Clear recently watched trailers"
        >
          Clear
        </button>
      </div>
      <div className="trailerRail__track">
        {items.map((m) => {
          const img = m.backdrop_path || m.poster_path;
          return (
            <button
              key={m.id}
              className="trailerRail__card"
              onClick={() => onSelectTitle && onSelectTitle(m)}
              aria-label={`View details for ${labelOf(m)}, trailer watched ${timeAgo(m.watchedAt)}`}
            >
              {img ? (
                <img src={`${IMG_BASE}${img}`} alt={labelOf(m)} loading="lazy" />
              ) : (
                <span className="trailerRail__fallback" aria-hidden="true">
                  {labelOf(m).slice(0, 1)}
                </span>
              )}
              <span className="trailerRail__play" aria-hidden="true">
                {"\u25B6"}
              </span>
              <span className="trailerRail__name">{labelOf(m)}</span>
              <span className="trailerRail__time">Trailer &middot; {timeAgo(m.watchedAt)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default TrailerHistoryRail;
