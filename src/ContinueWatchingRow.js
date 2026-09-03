import React, { useCallback, useEffect, useState } from "react";
import {
  getContinueWatching,
  removeContinueWatching,
  updateProgress,
} from "./utils/continueWatching";
import "./ContinueWatchingRow.css";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

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

function ContinueWatchingRow({ onSelectTitle }) {
  const [items, setItems] = useState(() => {
    try {
      return getContinueWatching();
    } catch (e) {
      return [];
    }
  });

  const refresh = useCallback(() => {
    try {
      setItems(getContinueWatching());
    } catch (e) {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e) => {
      if (!e.key || e.key === "aflixs_continue_watching") refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("aflixs:continue-watching-changed", onCustom);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("aflixs:continue-watching-changed", onCustom);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  if (items.length === 0) return null;

  const handleResume = (item) => {
    // Bump progress slightly to simulate resuming, then open details/trailer.
    updateProgress(item.id, Math.min(0.99, (item.progress || 0.05) + 0.05));
    refresh();
    if (onSelectTitle) onSelectTitle(item);
  };

  const handleRemove = (e, id) => {
    e.stopPropagation();
    removeContinueWatching(id);
    refresh();
  };

  return (
    <div className="row cwRow">
      <h2>Continue Watching</h2>
      <div className="row__posters">
        {items.map((item) => {
          const pct = Math.round((item.progress || 0) * 100);
          const img = item.backdrop_path || item.poster_path;
          return (
            <div key={item.id} className="row__card cwRow__card">
              <button
                className="cwRow__thumb"
                onClick={() => handleResume(item)}
                aria-label={`Resume ${item.title} at ${pct} percent`}
              >
                {img ? (
                  <img
                    className="row__poster"
                    src={`${IMG_BASE}${img}`}
                    alt={item.title}
                    loading="lazy"
                  />
                ) : (
                  <span className="cwRow__fallback">{item.title}</span>
                )}
                <span className="cwRow__progress" aria-hidden="true">
                  <span
                    className="cwRow__progressFill"
                    style={{ width: `${pct}%` }}
                  />
                </span>
              </button>
              <span className="cwRow__info">
                <span className="cwRow__title">{item.title}</span>
                <span className="cwRow__meta">
                  {pct}% watched | {timeAgo(item.updatedAt)}
                </span>
              </span>
              <button
                className="row__listBtn cwRow__remove"
                onClick={(e) => handleRemove(e, item.id)}
                aria-label={`Remove ${item.title} from Continue Watching`}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ContinueWatchingRow;
