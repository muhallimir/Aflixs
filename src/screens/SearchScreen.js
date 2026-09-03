import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import axios from "../axios";
import Nav from "../Nav";
import useDebounce from "../hooks/useDebounce";
import { TMDB_API_KEY } from "../request";
import "./SearchScreen.css";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function SearchScreen({ onSelectTitle }) {
  const location = useLocation();
  const history = useHistory();
  const initialQuery = new URLSearchParams(location.search).get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const debouncedQuery = useDebounce(query.trim(), 500);
  const queryParam = useQuery().get("q") || "";

  // Keep the input in sync when navigation (e.g. from Nav search) changes ?q=
  useEffect(() => {
    if (queryParam !== query) {
      setQuery(queryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Reflect debounced input back into the URL so results are shareable.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const current = params.get("q") || "";
    if (debouncedQuery !== current) {
      if (debouncedQuery) {
        params.set("q", debouncedQuery);
      } else {
        params.delete("q");
      }
      history.replace({
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      if (!debouncedQuery) {
        setResults([]);
        setError("");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
            debouncedQuery
          )}&page=1&include_adult=false`
        );
        if (cancelled) return;
        const filtered = (res.data.results || []).filter(
          (item) => item.media_type !== "person" && (item.poster_path || item.backdrop_path)
        );
        setResults(filtered);
      } catch (err) {
        if (cancelled) return;
        setError(
          "Search is unavailable right now. Check your connection and try again."
        );
        setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    runSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const showEmptyPrompt = !debouncedQuery && !loading;
  const showNoResults =
    debouncedQuery && !loading && !error && results.length === 0;

  return (
    <div className="searchScreen">
      <Nav />
      <div className="searchScreen__body">
        <h1 className="searchScreen__title">Search</h1>
        <form
          className="searchScreen__form"
          role="search"
          aria-label="Search movies and TV shows"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            className="searchScreen__input"
            type="search"
            value={query}
            autoFocus
            placeholder="Search movies, TV shows..."
            aria-label="Search movies and TV shows"
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="searchScreen__clear"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              Clear
            </button>
          )}
        </form>

        {debouncedQuery && !loading && !error && results.length > 0 && (
          <p className="searchScreen__meta" aria-live="polite">
            {results.length} result{results.length === 1 ? "" : "s"} for{" "}
            <strong>{debouncedQuery}</strong>
          </p>
        )}

        {loading && (
          <div className="searchScreen__grid" aria-label="Loading results">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="searchScreen__skeleton" aria-hidden="true">
                <div className="searchScreen__skeletonPoster" />
                <div className="searchScreen__skeletonLine" />
                <div className="searchScreen__skeletonLine short" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="searchScreen__state" role="alert">
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button
              className="searchScreen__retry"
              onClick={() => setQuery((q) => `${q} ` && q.trim())}
            >
              Retry
            </button>
          </div>
        )}

        {showEmptyPrompt && (
          <div className="searchScreen__state">
            <h2>Find your next favorite</h2>
            <p>Type a title above. Results appear as you type.</p>
            <div className="searchScreen__suggestions">
              {["Stranger Things", "Avengers", "The Office", "Dune"].map(
                (s) => (
                  <button key={s} onClick={() => setQuery(s)}>
                    {s}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {showNoResults && (
          <div className="searchScreen__state">
            <h2>No results for {debouncedQuery}</h2>
            <p>Try a different title, check spelling, or browse trending rows on Home.</p>
            <button onClick={() => history.push("/")}>Back to Home</button>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="searchScreen__grid">
            {results.map((item) => {
              const title =
                item.title || item.name || item.original_title || "Untitled";
              const year = (item.release_date || item.first_air_date || "").slice(0, 4);
              return (
                <button
                  key={`${item.media_type}-${item.id}`}
                  className="searchScreen__card"
                  onClick={() => onSelectTitle && onSelectTitle(item)}
                  aria-label={`View details for ${title}`}
                >
                  <img
                    src={`${IMG_BASE}${item.poster_path || item.backdrop_path}`}
                    alt={title}
                    loading="lazy"
                  />
                  <span className="searchScreen__cardBody">
                    <span className="searchScreen__cardTitle">{title}</span>
                    <span className="searchScreen__cardMeta">
                      {item.vote_average ? `${Number(item.vote_average).toFixed(1)} / 10` : "NR"}
                      {year ? `  |  ${year}` : ""}
                      {item.media_type ? `  |  ${item.media_type.toUpperCase()}` : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchScreen;
