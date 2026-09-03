import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectMyList } from "./features/myListSlice";
import { getContinueWatching } from "./utils/continueWatching";
import "./StatsDashboard.css";

const GENRE_NAMES = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  27: "Horror",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  10752: "War",
  10762: "Kids",
};

// Assume a 1h45 feature-equivalent per title for the hours estimate.
const HOURS_PER_TITLE = 1.75;

function StatsDashboard() {
  const myList = useSelector(selectMyList);
  const [history, setHistory] = useState(() => {
    try {
      return getContinueWatching();
    } catch (e) {
      return [];
    }
  });

  const refresh = useCallback(() => {
    try {
      setHistory(getContinueWatching());
    } catch (e) {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("aflixs:continue-watching-changed", refresh);
    window.addEventListener("aflixs:profile-switched", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("aflixs:continue-watching-changed", refresh);
      window.removeEventListener("aflixs:profile-switched", refresh);
    };
  }, [refresh]);

  const hours = history.reduce((sum, h) => sum + (h.progress || 0) * HOURS_PER_TITLE, 0);
  const completed = history.filter((h) => (h.progress || 0) >= 0.9).length;

  const genreCounts = {};
  myList.forEach((m) => {
    (m.genre_ids || []).forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCount = topGenres.length > 0 ? topGenres[0][1] : 0;

  return (
    <section className="statsDash" aria-label="Viewing stats">
      <h3>Viewing stats</h3>
      <div className="statsDash__cards">
        <div className="statsDash__card">
          <strong>{hours.toFixed(1)}h</strong>
          <span>Estimated watch time</span>
        </div>
        <div className="statsDash__card">
          <strong>{completed}</strong>
          <span>Titles completed</span>
        </div>
        <div className="statsDash__card">
          <strong>{history.length}</strong>
          <span>In progress</span>
        </div>
      </div>
      <h4>Top genres in My List</h4>
      {topGenres.length === 0 ? (
        <p className="statsDash__muted">Add titles to My List to see your genre mix.</p>
      ) : (
        <div className="statsDash__bars">
          {topGenres.map(([id, count]) => (
            <div key={id} className="statsDash__barRow">
              <span className="statsDash__barLabel">{GENRE_NAMES[id] || `Genre ${id}`}</span>
              <span className="statsDash__barTrack" aria-hidden="true">
                <span
                  className="statsDash__barFill"
                  style={{ width: `${maxCount ? Math.round((count / maxCount) * 100) : 0}%` }}
                />
              </span>
              <span className="statsDash__barCount" aria-label={`${count} titles`}>
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default StatsDashboard;
