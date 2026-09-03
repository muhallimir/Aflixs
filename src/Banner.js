import React, { useEffect, useState } from "react";
import axios from "./axios";
import request from "./request";
import "./Banner.css";
import { useDispatch, useSelector } from "react-redux";
import { toggleListItem } from "./features/myListSlice";
import { saveContinueWatching } from "./utils/continueWatching";
import movieTrailer from "movie-trailer";
import YouTube from "react-youtube";

function Banner({ onSelectTitle, onPlay }) {
  const [movie, setMovie] = useState(null);
  const [trailerUrl, setTrailerUrl] = useState("");
  const dispatch = useDispatch();
  const myList = useSelector((state) => state.myList.items);
  const inList =
    movie && movie.id != null
      ? myList.some((i) => String(i.id) === String(movie.id))
      : false;

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      //code
      try {
        const requests = await axios.get(request.fetchNetflixOriginals);
        const results = requests.data.results || [];
        if (!cancelled && results.length > 0) {
          setMovie(
            results[Math.floor(Math.random() * results.length)]
          );
        }
        return requests;
      } catch (err) {
        if (!cancelled) setMovie(null);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  //   Stackoverflow code to truncate texts
  function truncate(str, n) {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  }

  const handlePlay = () => {
    if (!movie) return;
    if (onSelectTitle) {
      onSelectTitle(movie);
      return;
    }
    if (onPlay) {
      onPlay(movie);
      return;
    }
    if (trailerUrl) {
      setTrailerUrl("");
      return;
    }
    const name = movie?.title || movie?.name || movie?.original_name || "";
    movieTrailer(name || "")
      .then((url) => {
        const urlParams = new URLSearchParams(new URL(url).search);
        setTrailerUrl(urlParams.get("v"));
        saveContinueWatching(movie, { progress: 0.05 });
      })
      .catch((error) => console.log(error));
  };

  const handleToggleList = () => {
    if (!movie) return;
    dispatch(toggleListItem(movie));
  };

  return (
    <header
      className="banner"
      style={{
        backgroundSize: "cover",
        backgroundImage: movie?.backdrop_path
          ? `url("https://image.tmdb.org/t/p/original/${movie.backdrop_path}")`
          : undefined,
        backgroundPosition: "center center",
      }}
    >
      <div className="banner__contents">
        {/* Title  with background image*/}
        <h1 className="banner__title">
          {movie?.title || movie?.name || movie?.original_name || "Featured title"}
        </h1>
        {/* div > 2 buttons */}
        <div className="banner__buttons">
          <button className="banner__button" onClick={handlePlay} aria-label="Play featured title">
            Play
          </button>
          <button
            className="banner__button"
            onClick={handleToggleList}
            aria-label={inList ? "Remove featured title from My List" : "Add featured title to My List"}
          >
            {inList ? "✓ My List" : "+ My List"}
          </button>
          {onSelectTitle && movie && (
            <button
              className="banner__button banner__button--ghost"
              onClick={() => onSelectTitle(movie)}
              aria-label="More info about featured title"
            >
              More Info
            </button>
          )}
        </div>
        {/* description */}
        <p className="banner__description">
          {truncate(movie?.overview, 150)}
        </p>
      </div>
      {trailerUrl && (
        <div className="banner__trailer">
          <YouTube
            videoId={trailerUrl}
            opts={{ height: "360", width: "100%", playerVars: { autoplay: 1 } }}
          />
        </div>
      )}
      <div className="banner--fadeBottom"></div>
    </header>
  );
}

export default Banner;
