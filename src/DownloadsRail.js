import React, { useCallback, useEffect, useState } from "react";
import {
  getDownloads,
  removeDownload,
  onDownloadsChanged,
  DOWNLOAD_QUOTA,
} from "./utils/downloads";
import "./DownloadsRail.css";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

function labelOf(m) {
  return m?.title || m?.name || m?.original_title || m?.original_name || "Untitled";
}

function DownloadsRail({ onSelectTitle }) {
  const [items, setItems] = useState(() => {
    try {
      return getDownloads();
    } catch (e) {
      return [];
    }
  });

  const refresh = useCallback(() => {
    try {
      setItems(getDownloads());
    } catch (e) {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    refresh();
    let off = () => {};
    try {
      off = onDownloadsChanged(refresh);
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
    <section className="dlRail" aria-label="Your downloads">
      <div className="dlRail__head">
        <h2>Downloads ({items.length}/{DOWNLOAD_QUOTA})</h2>
        <span className="dlRail__offline" title="Downloads play offline in this demo">
          Offline-ready
        </span>
      </div>
      <div className="dlRail__track">
        {items.map((m) => {
          const img = m.poster_path || m.backdrop_path;
          return (
            <div key={m.id} className="dlRail__card">
              <button
                className="dlRail__thumb"
                onClick={() => onSelectTitle && onSelectTitle(m)}
                aria-label={`View downloaded title ${labelOf(m)}`}
              >
                {img ? (
                  <img src={`${IMG_BASE}${img}`} alt={labelOf(m)} loading="lazy" />
                ) : (
                  <span className="dlRail__fallback" aria-hidden="true">
                    {labelOf(m).slice(0, 1)}
                  </span>
                )}
                <span className="dlRail__name">{labelOf(m)}</span>
              </button>
              <button
                className="dlRail__remove"
                onClick={() => {
                  try {
                    removeDownload(m.id);
                  } catch (e) {
                    // ignore
                  }
                  refresh();
                }}
                aria-label={`Remove ${labelOf(m)} from downloads`}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default DownloadsRail;
