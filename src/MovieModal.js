import React, { useEffect, useState } from "react";
import YouTube from "react-youtube";
import movieTrailer from "movie-trailer";
import axios from "./axios";
import { TMDB_API_KEY } from "./request";
import { useDispatch, useSelector } from "react-redux";
import { toggleListItem } from "./features/myListSlice";
import { saveContinueWatching } from "./utils/continueWatching";
import "./MovieModal.css";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const IMG_ORIGINAL = "https://image.tmdb.org/t/p/original";

function getTitle(movie) {
  return (
    movie?.title ||
    movie?.name ||
    movie?.original_title ||
    movie?.original_name ||
    "Untitled"
  );
}

function getYear(movie) {
  return (movie?.release_date || movie?.first_air_date || "").slice(0, 4);
}

function getMediaType(movie) {
  if (movie?.media_type === "tv" || movie?.media_type === "movie") return movie.media_type;
  if (movie?.first_air_date && !movie?.release_date) return "tv";
  if (movie?.name && !movie?.title) return "tv";
  return "movie";
}

function MovieModal({ movie, onClose, onSelectTitle }) {
  const [trailerUrl, setTrailerUrl] = useState("");
  const [trailerError, setTrailerError] = useState("");
  const [similar, setSimilar] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const dispatch = useDispatch();
  const myList = useSelector((state) => state.myList.items);
  const inList = movie
    ? myList.some((i) => String(i.id) === String(movie.id))
    : false;

  // Reset per-movie state when selection changes.
  useEffect(() => {
    setTrailerUrl("");
    setTrailerError("");
    setSimilar([]);
  }, [movie?.id]);

  // Lock body scroll + close on Escape for accessibility.
  useEffect(() => {
    if (!movie) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [movie, onClose]);

  // Fetch similar titles.
  useEffect(() => {
    if (!movie?.id) return;
    let cancelled = false;
    async function fetchSimilar() {
      setSimilarLoading(true);
      try {
        const type = getMediaType(movie);
        const res = await axios.get(
          `/${type}/${movie.id}/similar?api_key=${TMDB_API_KEY}&language=en-US&page=1`
        );
        if (!cancelled) setSimilar((res.data.results || []).slice(0, 12));
      } catch (err) {
        if (!cancelled) setSimilar([]);
      } finally {
        if (!cancelled) setSimilarLoading(false);
      }
    }
    fetchSimilar();
    return () => {
      cancelled = true;
    };
  }, [movie]);

  if (!movie) return null;

  const title = getTitle(movie);
  const year = getYear(movie);
  const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : "NR";

  const handlePlayTrailer = () => {
    if (trailerUrl) {
      setTrailerUrl("");
      return;
    }
    setTrailerError("");
    movieTrailer(title || "")
      .then((url) => {
        if (!url) {
          setTrailerError("Trailer not found for this title.");
          return;
        }
        const urlParams = new URLSearchParams(new URL(url).search);
        setTrailerUrl(urlParams.get("v"));
        saveContinueWatching(movie, { progress: 0.08 });
      })
      .catch(() => setTrailerError("Trailer not found for this title."));
  };

  const backdrop = movie.backdrop_path
    ? `${IMG_ORIGINAL}${movie.backdrop_path}`
    : movie.poster_path
    ? `${IMG_ORIGINAL}${movie.poster_path}`
    : null;

  return (
    <div
      className="movieModal__overlay"
      onClick={onClose}
      role="presentation"
      aria-hidden={false}
    >
      <div
        className="movieModal"
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="movieModal__close" onClick={onClose} aria-label="Close details" autoFocus>
          X
        </button>
        {backdrop && (
          <div
            className="movieModal__hero"
            style={{ backgroundImage: `url("${backdrop}")` }}
          >
            <div className="movieModal__heroFade" />
          </div>
        )}
        <div className="movieModal__body">
          <div className="movieModal__main">
            {movie.poster_path && (
              <img
                className="movieModal__poster"
                src={`${IMG_BASE}${movie.poster_path}`}
                alt={`${title} poster`}
              />
            )}
            <div className="movieModal__info">
              <h2 className="movieModal__title">{title}</h2>
              <p className="movieModal__meta">
                <span className="movieModal__rating">{rating} / 10</span>
                {year && <span> | {year}</span>}
                <span> | {getMediaType(movie).toUpperCase()}</span>
                {movie.original_language && (
                  <span> | {String(movie.original_language).toUpperCase()}</span>
                )}
              </p>
              <p className="movieModal__overview">
                {movie.overview || "No overview available for this title yet."}
              </p>
              <div className="movieModal__actions">
                <button className="movieModal__btn primary" onClick={handlePlayTrailer}>
                  {trailerUrl ? "Hide Trailer" : "Play Trailer"}
                </button>
                <button
                  className="movieModal__btn"
                  onClick={() => dispatch(toggleListItem(movie))}
                >
                  {inList ? "✓ In My List" : "+ My List"}
                </button>
              </div>
              {trailerError && <p className="movieModal__error">{trailerError}</p>}
            </div>
          </div>

          {trailerUrl && (
            <div className="movieModal__trailer">
              <YouTube
                videoId={trailerUrl}
                opts={{ height: "360", width: "100%", playerVars: { autoplay: 1 } }}
              />
            </div>
          )}

          <div className="movieModal__similar">
            <h3>Similar titles</h3>
            {similarLoading && <p className="movieModal__muted">Loading similar titles...</p>}
            {!similarLoading && similar.length === 0 && (
              <p className="movieModal__muted">No similar titles found.</p>
            )}
            <div className="movieModal__similarGrid">
              {similar.map((s) => {
                if (!s.poster_path) return null;
                const sTitle = getTitle(s);
                return (
                  <button
                    key={s.id}
                    className="movieModal__similarCard"
                    onClick={() => onSelectTitle && onSelectTitle(s)}
                    aria-label={`View details for ${sTitle}`}
                  >
                    <img src={`${IMG_BASE}${s.poster_path}`} alt={sTitle} loading="lazy" />
                    <span>{sTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieModal;
