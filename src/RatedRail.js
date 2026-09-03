import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectMyList } from "./features/myListSlice";
import { getRatings, onRatingsChanged } from "./utils/ratings";
import { getContinueWatching } from "./utils/continueWatching";
import { getRecentlyViewed } from "./utils/recentlyViewed";
import "./RatedRail.css";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

function labelOf(m) {
  return m?.title || m?.name || m?.original_title || m?.original_name || `Title #${m?.id}`;
}

function RatedRail({ onSelectTitle }) {
  const myList = useSelector(selectMyList);
  const [rated, setRated] = useState(() => {
    try {
      return getRatings();
    } catch (e) {
      return {};
    }
  });

  const refresh = useCallback(() => {
    try {
      setRated(getRatings());
    } catch (e) {
      setRated({});
    }
  }, []);

  useEffect(() => {
    refresh();
    let off = () => {};
    try {
      off = onRatingsChanged(refresh);
    } catch (e) {
      // ignore
    }
    return off;
  }, [refresh]);

  const ids = Object.keys(rated);
  if (ids.length === 0) return null;

  let library = [];
  try {
    library = [...myList, ...getContinueWatching(), ...getRecentlyViewed()];
  } catch (e) {
    library = [...myList];
  }
  const byId = new Map(library.map((m) => [String(m.id), m]));

  return (
    <section className="ratedRail" aria-label="Your ratings">
      <h2>Your Ratings</h2>
      <div className="ratedRail__track">
        {ids.map((id) => {
          const stars = rated[id];
          const meta = byId.get(String(id)) || { id, media_type: "movie" };
          const img = meta.poster_path || meta.backdrop_path;
          return (
            <button
              key={id}
              className="ratedRail__card"
              onClick={() => onSelectTitle && onSelectTitle(meta)}
              aria-label={`${labelOf(meta)}, rated ${stars} out of 5`}
            >
              {img ? (
                <img src={`${IMG_BASE}${img}`} alt={labelOf(meta)} loading="lazy" />
              ) : (
                <span className="ratedRail__fallback" aria-hidden="true">
                  {labelOf(meta).slice(0, 1)}
                </span>
              )}
              <span className="ratedRail__stars" aria-hidden="true">
                {"\u2605".repeat(stars)}
                <span className="ratedRail__starsOff">{"\u2605".repeat(5 - stars)}</span>
              </span>
              <span className="ratedRail__name">{labelOf(meta)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default RatedRail;
