import React, { useEffect, useState } from "react";
import axios from "./axios";
import request from "./request";
import { isDemoMode, getMockCatalog } from "./utils/mockCatalog";
import { getPrefs, onPrefsChanged } from "./utils/prefs";
import { filterKidsMode } from "./utils/kidsFilter";
import "./Top10Row.css";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

function titleOf(m) {
  return m?.title || m?.name || m?.original_title || m?.original_name || "Untitled";
}

function Top10Row({ onSelectTitle }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefsState] = useState(() => {
    try {
      return getPrefs();
    } catch (e) {
      return { kidsMode: false };
    }
  });

  useEffect(() => {
    let off = () => {};
    try {
      off = onPrefsChanged(setPrefsState);
    } catch (e) {
      // ignore
    }
    return off;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        if (isDemoMode()) {
          if (!cancelled) setMovies(getMockCatalog().slice(0, 10));
          return;
        }
        const res = await axios.get(request.fetchTopRated);
        if (!cancelled) setMovies((res.data.results || []).slice(0, 10));
      } catch (e) {
        if (!cancelled) setMovies([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = filterKidsMode(movies, prefs.kidsMode).slice(0, 10);
  if (!loading && visible.length === 0) return null;

  return (
    <section className="top10Row" aria-label="Top 10 today">
      <h2 className="top10Row__title">Top 10 Today</h2>
      {loading ? (
        <div className="top10Row__track" aria-label="Loading Top 10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="top10Row__skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : (
        <div className="top10Row__track">
          {visible.map((m, idx) => (
            <button
              key={m.id}
              className="top10Row__card"
              onClick={() => onSelectTitle && onSelectTitle(m)}
              aria-label={`Rank ${idx + 1}: ${titleOf(m)}`}
            >
              <span className="top10Row__rank" aria-hidden="true">
                {idx + 1}
              </span>
              {m.poster_path ? (
                <img
                  className="top10Row__poster"
                  src={`${IMG_BASE}${m.poster_path}`}
                  alt={titleOf(m)}
                  loading="lazy"
                />
              ) : (
                <span
                  className="top10Row__fallback"
                  style={{ background: m.mockColor || "#333" }}
                  aria-hidden="true"
                >
                  {titleOf(m).slice(0, 1)}
                </span>
              )}
              <span className="top10Row__name">{titleOf(m)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default Top10Row;
