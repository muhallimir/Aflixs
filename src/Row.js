import "./Row.css";
import React, { useEffect, useState } from "react";
import axios from "./axios";
import YouTube from "react-youtube";
import movieTrailer from "movie-trailer";
import { useDispatch, useSelector } from "react-redux";
import { toggleListItem } from "./features/myListSlice";
import { saveContinueWatching } from "./utils/continueWatching";
import { getRating, onRatingsChanged } from "./utils/ratings";

const baseURL = "https://image.tmdb.org/t/p/original";

function Row({ title, fetchUrl, isLargeRow, moviesOverride, onSelectTitle }) {
  const [movies, setMovies] = useState(moviesOverride || []);
  const [loading, setLoading] = useState(!moviesOverride);
  const [trailerUrl, setTrailerUrl] = useState("");
  const [activeTrailerId, setActiveTrailerId] = useState(null);
  const dispatch = useDispatch();
  const myList = useSelector((state) => state.myList.items);
  const [ratingsTick, setRatingsTick] = useState(0);

  useEffect(() => {
    let off = () => {};
    try {
      off = onRatingsChanged(() => setRatingsTick((t) => t + 1));
    } catch (e) {
      // ignore
    }
    return off;
  }, []);

  const isInList = (id) => myList.some((i) => String(i.id) === String(id));

  // snippet off code which runs based on specific condition/variable
  // pulling information from TMDB
  useEffect(() => {
    // My List / custom rows render directly from props (no fetch).
    if (moviesOverride) {
      setMovies(moviesOverride);
      setLoading(false);
      return;
    }
    // if [] --blank, run once when the row loads, and don't run again
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const request = await axios.get(fetchUrl);
        // Sample URL result: "https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}&language=en-US"
        if (!cancelled) setMovies(request.data.results || []);
        return request;
      } catch (err) {
        if (!cancelled) setMovies([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [fetchUrl, moviesOverride]);

  const opts = {
    height: "400",
    width: "100%",
    playerVars: {
      //
      autoplay: 1,
    },
  };

  const handleClick = (movie) => {
    // If a detail-modal handler is provided, prefer it (progessive enhancement).
    if (onSelectTitle) {
      onSelectTitle(movie);
      return;
    }
    if (trailerUrl && activeTrailerId === movie.id) {
      setTrailerUrl("");
      setActiveTrailerId(null);
    } else {
      const name = movie?.title || movie?.name || movie?.original_name || "";
      movieTrailer(name || "")
        .then((url) => {
          // Sample youtube video url: https://www.youtube.com/watch?v=X4bF_quwNtw&t=18s&ab_channel=LuciferLuciferVerified
          const urlParams = new URLSearchParams(new URL(url).search);
          setTrailerUrl(urlParams.get("v"));
          setActiveTrailerId(movie.id);
          // Track continue-watching so Home can show a resume row.
          saveContinueWatching(movie, { progress: 0.05 });
        })
        .catch((error) => console.log(error));
    }
  };

  const handleToggleList = (e, movie) => {
    e.stopPropagation();
    dispatch(toggleListItem(movie));
  };

  const handleKeyDown = (e, movie) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(movie);
    }
  };

  if (!loading && movies.length === 0 && !moviesOverride) return null;

  return (
    <div className="row">
      {/* Title */}
      <h2>{title}</h2>
      {/* poster */}
      {loading ? (
        <div className="row__posters" aria-label={`Loading ${title}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`row__skeleton ${isLargeRow ? "row__skeletonLarge" : ""}`}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : (
      <div className="row__posters">
        {movies.map((movie) => {
          const imgPath = isLargeRow ? movie.poster_path : movie.backdrop_path;
          if (!imgPath) return null;
          const label = movie.title || movie.name || movie.original_name || "title";
          const inList = isInList(movie.id);
          let userStars = 0;
          try {
            userStars = getRating(movie.id);
          } catch (e) {
            userStars = 0;
          }
          void ratingsTick;
          return (
            <div key={movie.id} className="row__card">
              {userStars > 0 && (
                <span className="row__userStars" aria-label={`You rated this ${userStars} of 5`}>
                  {"\u2605"} {userStars}
                </span>
              )}
              <img
                onClick={() => handleClick(movie)}
                onKeyDown={(e) => handleKeyDown(e, movie)}
                className={`row__poster ${isLargeRow && "row__posterLarge"}`}
                src={`${baseURL}${imgPath}`}
                alt={label}
                tabIndex={0}
                role="button"
                aria-label={`Play trailer for ${label}`}
                loading="lazy"
              />
              <button
                className={`row__listBtn ${inList ? "row__listBtn--active" : ""}`}
                onClick={(e) => handleToggleList(e, movie)}
                aria-label={inList ? `Remove ${label} from My List` : `Add ${label} to My List`}
                title={inList ? "Remove from My List" : "Add to My List"}
              >
                {inList ? "✓ My List" : "+ My List"}
              </button>
            </div>
          );
        })}
      </div>
      )}
      {trailerUrl && <YouTube videoId={trailerUrl} opts={opts} />}
    </div>
  );
}

export default Row;
