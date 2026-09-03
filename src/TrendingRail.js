import React, { useEffect, useState } from "react";
import axios from "./axios";
import { TMDB_API_KEY } from "./request";
import { isDemoMode, getMockCatalog } from "./utils/mockCatalog";
import { getPrefs, onPrefsChanged } from "./utils/prefs";
import { filterKidsMode } from "./utils/kidsFilter";
import "./TrendingRail.css";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

function labelOf(m) {
  return m?.title || m?.name || m?.original_title || m?.original_name || "Untitled";
}

function TrendingRail({ onSelectTitle }) {
  const [window_, setWindow_] = useState("week");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
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
      setError("");
      try {
        if (isDemoMode()) {
          if (!cancelled) setMovies(getMockCatalog().slice(2, 12));
          return;
        }
        const res = await axios.get(
          `/trending/all/${window_}?api_key=${TMDB_API_KEY}&language=en-US`
        );
        if (!cancelled) setMovies(res.data.results || []);
      } catch (e) {
        if (!cancelled) {
          setMovies([]);
          setError("Trending is unavailable right now.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [window_, reloadKey]);

  const visible = filterKidsMode(movies, prefs.kidsMode);

  return (
    <section className="trendingRail" aria-label="Trending now">
      <div className="trendingRail__head">
        <h2>Trending Now</h2>
        <div className="trendingRail__toggle" role="group" aria-label="Trending time window">
          {(["day", "week"]).map((w) => (
            <button
              key={w}
              className={`trendingRail__toggleBtn ${window_ === w ? "active" : ""}`}
              aria-pressed={window_ === w}
              onClick={() => setWindow_(w)}
            >
              {w === "day" ? "Today" : "This week"}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="trendingRail__track" aria-label="Loading trending">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="trendingRail__skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : error ? (
        <div className="trendingRail__state" role="alert">
          <p>{error}</p>
          <button onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </button>
        </div>
      ) : visible.length === 0 ? null : (
        <div className="trendingRail__track">
          {visible.map((m) => {
            if (!m.poster_path && !m.backdrop_path && !m.mockColor) return null;
            return (
              <button
                key={`${m.media_type || "t"}-${m.id}`}
                className="trendingRail__card"
                onClick={() => onSelectTitle && onSelectTitle(m)}
                aria-label={`View details for ${labelOf(m)}`}
              >
                {m.poster_path ? (
                  <img src={`${IMG_BASE}${m.poster_path}`} alt={labelOf(m)} loading="lazy" />
                ) : (
                  <span
                    className="trendingRail__fallback"
                    style={{ background: m.mockColor || "#333" }}
                    aria-hidden="true"
                  >
                    {labelOf(m).slice(0, 1)}
                  </span>
                )}
                <span className="trendingRail__name">{labelOf(m)}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default TrendingRail;
