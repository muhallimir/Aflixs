import React, { useEffect, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import axios from "../axios";
import Nav from "../Nav";
import Footer from "../Footer";
import useDebounce from "../hooks/useDebounce";
import { TMDB_API_KEY } from "../request";
import MaturityBadge from "../MaturityBadge";
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
  const [genreList, setGenreList] = useState([]);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("popularity");
  const [pickedGenres, setPickedGenres] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  const debouncedQuery = useDebounce(query.trim(), 500);
  const queryParam = useQuery().get("q") || "";

  // Keep the input in sync when navigation (e.g. from Nav search) changes ?q=
  useEffect(() => {
    if (queryParam !== query) {
      setQuery(queryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Reflect debounced input back into the URL so results are shareable.  useEffect(() => {
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

  // Load genre list once for the multi-select filter.
  useEffect(() => {
    let cancelled = false;
    async function loadGenres() {
      try {
        const res = await axios.get(
          `/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`
        );
        if (!cancelled) setGenreList(res.data.genres || []);
      } catch (e) {
        if (!cancelled) setGenreList([]);
      }
    }
    loadGenres();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      if (!debouncedQuery) {
        setResults([]);
        setError("");
        setLoading(false);
        setPage(1);
        setTotalPages(1);
        return;
      }
      setLoading(true);
      setError("");
      setPage(1);
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
        setTotalPages(res.data.total_pages || 1);
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

  // Infinite scroll: load the next TMDB page when the sentinel appears.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !debouncedQuery || loading || loadingMore) return;
    if (page >= totalPages) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          setLoadingMore(true);
          axios
            .get(
              `/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
                debouncedQuery
              )}&page=${page + 1}&include_adult=false`
            )
            .then((res) => {
              const more = (res.data.results || []).filter(
                (item) => item.media_type !== "person" && (item.poster_path || item.backdrop_path)
              );
              setResults((prev) => [...prev, ...more]);
              setPage((p) => p + 1);
            })
            .catch(() => {
              // Keep existing results; user can retry via filters/sentinel re-entry.
            })
            .finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [debouncedQuery, loading, loadingMore, page, totalPages]);

  const showEmptyPrompt = !debouncedQuery && !loading;
  const showNoResults =
    debouncedQuery && !loading && !error && results.length === 0;

  const toggleGenre = (id) => {
    setPickedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const yearOf = (item) =>
    parseInt((item.release_date || item.first_air_date || "").slice(0, 4), 10) || 0;

  const filtered = results
    .filter((item) => {
      if (pickedGenres.length > 0) {
        const ids = item.genre_ids || [];
        if (!pickedGenres.every((g) => ids.includes(g))) return false;
      }
      const y = yearOf(item);
      if (yearFrom && (!y || y < parseInt(yearFrom, 10))) return false;
      if (yearTo && (!y || y > parseInt(yearTo, 10))) return false;
      if (minRating > 0 && (item.vote_average || 0) < minRating) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b.vote_average || 0) - (a.vote_average || 0);
      if (sortBy === "newest") return yearOf(b) - yearOf(a);
      return (b.popularity || 0) - (a.popularity || 0);
    });

  const filtersActive =
    pickedGenres.length > 0 || yearFrom || yearTo || minRating > 0 || sortBy !== "popularity";

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
            {filtered.length} of {results.length} result{results.length === 1 ? "" : "s"} for{" "}
            <strong>{debouncedQuery}</strong>
          </p>
        )}

        {debouncedQuery && (
          <div className="searchScreen__filters">
            <button
              type="button"
              className="searchScreen__filtersToggle"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((o) => !o)}
            >
              {filtersOpen ? "Hide filters" : "Filters"}
              {filtersActive && !filtersOpen ? " (on)" : ""}
            </button>
            {filtersOpen && (
              <div className="searchScreen__filterPanel">
                <div className="searchScreen__filterRow">
                  <label>
                    From year
                    <input
                      type="number"
                      min="1900"
                      max="2030"
                      value={yearFrom}
                      placeholder="e.g. 2000"
                      onChange={(e) => setYearFrom(e.target.value)}
                      aria-label="From year"
                    />
                  </label>
                  <label>
                    To year
                    <input
                      type="number"
                      min="1900"
                      max="2030"
                      value={yearTo}
                      placeholder="e.g. 2024"
                      onChange={(e) => setYearTo(e.target.value)}
                      aria-label="To year"
                    />
                  </label>
                  <label>
                    Min rating
                    <select
                      value={minRating}
                      onChange={(e) => setMinRating(Number(e.target.value))}
                      aria-label="Minimum rating"
                    >
                      <option value={0}>Any</option>
                      <option value={5}>5+</option>
                      <option value={6}>6+</option>
                      <option value={7}>7+</option>
                      <option value={8}>8+</option>
                    </select>
                  </label>
                  <label>
                    Sort by
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Sort results by"
                    >
                      <option value="popularity">Popularity</option>
                      <option value="rating">Rating</option>
                      <option value="newest">Newest</option>
                    </select>
                  </label>
                </div>
                {genreList.length > 0 && (
                  <div className="searchScreen__genrePills" role="group" aria-label="Filter by genre">
                    {genreList.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className={`searchScreen__genrePill ${pickedGenres.includes(g.id) ? "active" : ""}`}
                        aria-pressed={pickedGenres.includes(g.id)}
                        onClick={() => toggleGenre(g.id)}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                )}
                {filtersActive && (
                  <button
                    type="button"
                    className="searchScreen__clearFilters"
                    onClick={() => {
                      setYearFrom("");
                      setYearTo("");
                      setMinRating(0);
                      setSortBy("popularity");
                      setPickedGenres([]);
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
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

        {!loading && !error && filtered.length > 0 && (
          <>
          <div className="searchScreen__grid">
            {filtered.map((item) => {
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
                    <span className="searchScreen__cardBadge">
                      <MaturityBadge movie={item} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
          {loadingMore && (
            <div className="searchScreen__grid" aria-label="Loading more results">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="searchScreen__skeleton" aria-hidden="true">
                  <div className="searchScreen__skeletonPoster" />
                  <div className="searchScreen__skeletonLine" />
                </div>
              ))}
            </div>
          )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default SearchScreen;
