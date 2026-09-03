import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import axios from "./axios";
import { TMDB_API_KEY } from "./request";
import { selectMyList } from "./features/myListSlice";
import { getPrefs, onPrefsChanged } from "./utils/prefs";
import { filterKidsMode } from "./utils/kidsFilter";
import { passesMaturity } from "./utils/maturity";
import "./RecommendationsRail.css";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

function labelOf(m) {
  return m?.title || m?.name || m?.original_title || m?.original_name || "Untitled";
}

function RecommendationsRail({ onSelectTitle }) {
  const myList = useSelector(selectMyList);
  const history = useHistory();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [prefs, setPrefsState] = useState(() => {
    try {
      return getPrefs();
    } catch (e) {
      return { kidsMode: false, maturityLevel: "all" };
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
      if (!myList || myList.length === 0) {
        setRecs([]);
        setAnchor(null);
        return;
      }
      // Pick the most recent My List item that has genre info as the anchor.
      const withGenres = [...myList].reverse().find((m) => Array.isArray(m.genre_ids) && m.genre_ids.length > 0);
      const seed = withGenres || [...myList].reverse()[0];
      setAnchor(seed);
      setLoading(true);
      try {
        const genreParam =
          seed.genre_ids && seed.genre_ids.length > 0
            ? `&with_genres=${seed.genre_ids.slice(0, 2).join(",")}`
            : "";
        const res = await axios.get(
          `/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc${genreParam}&page=1`
        );
        if (cancelled) return;
        const listed = new Set(myList.map((m) => String(m.id)));
        const out = (res.data.results || [])
          .filter((m) => !listed.has(String(m.id)))
          .slice(0, 12);
        setRecs(out);
      } catch (e) {
        if (!cancelled) setRecs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [myList]);

  if (!myList || myList.length === 0) {
    return (
      <section className="recsRail" aria-label="Recommendations">
        <h2>Because you watch</h2>
        <div className="recsRail__empty">
          <p>Add titles to My List and we will recommend more like them.</p>
          <button onClick={() => history.push("/browse")}>Browse genres</button>
        </div>
      </section>
    );
  }

  const visible = filterKidsMode(recs, prefs.kidsMode).filter((m) =>
    passesMaturity(m, prefs)
  );
  if (!loading && visible.length === 0) return null;

  return (
    <section className="recsRail" aria-label="Recommendations">
      <h2>{anchor ? `Because you listed ${labelOf(anchor)}` : "Recommended for you"}</h2>
      {loading ? (
        <div className="recsRail__track" aria-label="Loading recommendations">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="recsRail__skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : (
        <div className="recsRail__track">
          {visible.map((m) => {
            if (!m.poster_path && !m.backdrop_path) return null;
            return (
              <button
                key={m.id}
                className="recsRail__card"
                onClick={() => onSelectTitle && onSelectTitle(m)}
                aria-label={`View details for ${labelOf(m)}`}
              >
                <img
                  src={`${IMG_BASE}${m.poster_path || m.backdrop_path}`}
                  alt={labelOf(m)}
                  loading="lazy"
                />
                <span className="recsRail__name">{labelOf(m)}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RecommendationsRail;
