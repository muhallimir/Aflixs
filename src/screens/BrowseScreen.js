import React, { useEffect, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import axios from "../axios";
import Nav from "../Nav";
import Footer from "../Footer";
import { TMDB_API_KEY } from "../request";
import { setPageMeta } from "../utils/seo";
import { getPrefs, onPrefsChanged } from "../utils/prefs";
import { filterKidsMode } from "../utils/kidsFilter";
import { isDemoMode, getMockCatalog } from "../utils/mockCatalog";
import MaturityBadge from "../MaturityBadge";
import "./BrowseScreen.css";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

const GENRE_DEMO = [
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 16, name: "Animation" },
  { id: 10751, name: "Family" },
  { id: 878, name: "Sci-Fi" },
];

function labelOf(m) {
  return m?.title || m?.name || m?.original_title || m?.original_name || "Untitled";
}

function BrowseScreen({ onSelectTitle }) {
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const activeGenre = params.get("genre") || "";
  const [genres, setGenres] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);
  const [prefs, setPrefsState] = useState(() => {
    try {
      return getPrefs();
    } catch (e) {
      return { kidsMode: false };
    }
  });

  useEffect(() => {
    setPageMeta({ title: "Browse", description: "Browse Aflixs by genre.", path: "/browse" });
  }, []);

  useEffect(() => {
    let off = () => {};
    try {
      off = onPrefsChanged(setPrefsState);
    } catch (e) {
      // ignore
    }
    return off;
  }, []);

  // Load genre lists (movie genres; TV merged by name).
  useEffect(() => {
    let cancelled = false;
    async function loadGenres() {
      if (isDemoMode()) {
        if (!cancelled) setGenres(GENRE_DEMO);
        return;
      }
      try {
        const [movieRes, tvRes] = await Promise.all([
          axios.get(`/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`),
          axios.get(`/genre/tv/list?api_key=${TMDB_API_KEY}&language=en-US`),
        ]);
        if (cancelled) return;
        const merged = new Map();
        (movieRes.data.genres || []).forEach((g) => merged.set(g.id, g));
        (tvRes.data.genres || []).forEach((g) => {
          if (!merged.has(g.id)) merged.set(g.id, g);
        });
        setGenres(Array.from(merged.values()));
      } catch (e) {
        if (!cancelled) setGenres(GENRE_DEMO);
      }
    }
    loadGenres();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load results for the active genre.
  useEffect(() => {
    let cancelled = false;
    async function loadResults() {
      if (!activeGenre) {
        setResults([]);
        setError("");
        return;
      }
      setLoading(true);
      setError("");
      setPage(1);
      try {
        if (isDemoMode()) {
          if (!cancelled) {
            setResults(
              getMockCatalog().filter((t) =>
                (t.genre_ids || []).includes(Number(activeGenre))
              )
            );
            setTotalPages(1);
          }
          return;
        }
        const res = await axios.get(
          `/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&with_genres=${activeGenre}&page=1`
        );
        if (!cancelled) {
          setResults(res.data.results || []);
          setTotalPages(res.data.total_pages || 1);
        }
      } catch (e) {
      } catch (e) {
        if (!cancelled) {
          setResults([]);
          setError("Browse is unavailable right now. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadResults();
    return () => {
      cancelled = true;
    };
  }, [activeGenre]);

  // Infinite scroll: next discover page when the sentinel appears.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !activeGenre || loading || loadingMore || isDemoMode()) return;
    if (page >= totalPages) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          setLoadingMore(true);
          axios
            .get(
              `/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&with_genres=${activeGenre}&page=${page + 1}`
            )
            .then((res) => {
              setResults((prev) => [...prev, ...(res.data.results || [])]);
              setPage((p) => p + 1);
            })
            .catch(() => {
              // Keep existing results.
            })
            .finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeGenre, loading, loadingMore, page, totalPages]);

  const pickGenre = (id) => {
    const p = new URLSearchParams(location.search);
    if (!id) p.delete("genre");
    else p.set("genre", String(id));
    history.push({ pathname: location.pathname, search: p.toString() ? `?${p.toString()}` : "" });
  };

  const visible = filterKidsMode(results, prefs.kidsMode);
  const activeName = genres.find((g) => String(g.id) === String(activeGenre))?.name;

  return (
    <div className="browseScreen">
      <Nav />
      <div className="browseScreen__body">
        <h1 className="browseScreen__title">Browse by Genre</h1>
        <div className="browseScreen__pills" role="group" aria-label="Genres">
          <button
            className={`browseScreen__pill ${!activeGenre ? "active" : ""}`}
            aria-pressed={!activeGenre}
            onClick={() => pickGenre("")}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              className={`browseScreen__pill ${String(activeGenre) === String(g.id) ? "active" : ""}`}
              aria-pressed={String(activeGenre) === String(g.id)}
              onClick={() => pickGenre(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>

        {!activeGenre && (
          <div className="browseScreen__state">
            <h2>Pick a genre to start browsing</h2>
            <p>Genres are shareable: the URL updates with ?genre= so you can send it to a friend.</p>
          </div>
        )}

        {activeGenre && loading && (
          <div className="browseScreen__grid" aria-label="Loading genre results">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="browseScreen__skeleton" aria-hidden="true">
                <div className="browseScreen__skeletonPoster" />
                <div className="browseScreen__skeletonLine" />
              </div>
            ))}
          </div>
        )}

        {activeGenre && error && (
          <div className="browseScreen__state" role="alert">
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button onClick={() => pickGenre(activeGenre)}>Retry</button>
          </div>
        )}

        {activeGenre && !loading && !error && visible.length === 0 && (
          <div className="browseScreen__state">
            <h2>No titles{activeName ? ` for ${activeName}` : ""} right now</h2>
            <p>Try another genre or clear Kids Mode in Settings.</p>
            <button onClick={() => pickGenre("")}>Clear genre</button>
          </div>
        )}

        {activeGenre && !loading && !error && visible.length > 0 && (
          <>
            <p className="browseScreen__meta" aria-live="polite">
              {visible.length} title{visible.length === 1 ? "" : "s"}
              {activeName ? ` in ${activeName}` : ""}
            </p>
            <div className="browseScreen__grid">
              {visible.map((item) => (
                <button
                  key={`${item.media_type || "movie"}-${item.id}`}
                  className="browseScreen__card"
                  onClick={() => onSelectTitle && onSelectTitle(item)}
                  aria-label={`View details for ${labelOf(item)}`}
                >
                  {item.poster_path || item.backdrop_path ? (
                    <img
                      src={`${IMG_BASE}${item.poster_path || item.backdrop_path}`}
                      alt={labelOf(item)}
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="browseScreen__fallback"
                      style={{ background: item.mockColor || "#333" }}
                      aria-hidden="true"
                    >
                      {labelOf(item).slice(0, 1)}
                    </span>
                  )}
                  <span className="browseScreen__cardBody">
                    <span className="browseScreen__cardTitle">{labelOf(item)}</span>
                    <span className="browseScreen__cardMeta">
                      {item.vote_average ? `${Number(item.vote_average).toFixed(1)} / 10` : "NR"}
                      {"  "}
                      <MaturityBadge movie={item} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
            {loadingMore && (
              <div className="browseScreen__grid" aria-label="Loading more titles">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="browseScreen__skeleton" aria-hidden="true">
                    <div className="browseScreen__skeletonPoster" />
                    <div className="browseScreen__skeletonLine" />
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

export default BrowseScreen;
