import "./Row.css";
import React, { useEffect, useState } from "react";
import axios from "./axios";
import YouTube from "react-youtube";
import movieTrailer from "movie-trailer";

const baseURL = "https://image.tmdb.org/t/p/original";

function Row({ title, fetchUrl, isLargeRow }) {
  const [movies, setMovies] = useState([]);
  const [trailerUrl, setTrailerUrl] = useState("");

  // snippet off code which runs based on specific condition/variable
  // pulling information from TMDB
  useEffect(() => {
    // if [] --blank, run once when the row loads, and don't run again
    async function fetchData() {
      const request = await axios.get(fetchUrl);
      // Sample URL result: "https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}&language=en-US"
      setMovies(request.data.results);
      return request;
    }
    fetchData();
  }, [fetchUrl]);

  const opts = {
    height: "400",
    width: "100%",
    playerVars: {
      //
      autoplay: 1,
    },
  };

  const handleClick = (movie) => {
    if (trailerUrl) {
      setTrailerUrl("");
    } else {
      movieTrailer(movie?.name || "")
        .then((url) => {
          // Sample youtube video url: https://www.youtube.com/watch?v=X4bF_quwNtw&t=18s&ab_channel=LuciferLuciferVerified
          const urlParams = new URLSearchParams(new URL(url).search);
          setTrailerUrl(urlParams.get("v"));
        })
        .catch((error) => console.log(error));
    }
  };

  return (
    <div className="row">
      {/* Title */}
      <h2>{title}</h2>
      {/* poster */}
      <div className="row__posters">
        {movies.map((movie) => (
          <img
            key={movie.id}
            onClick={() => handleClick(movie)}
            className={`row__poster ${isLargeRow && "row__posterLarge"}`}
            src={`${baseURL}${
              isLargeRow ? movie.poster_path : movie.backdrop_path
            }`}
            alt={movie.name}
          />
        ))}
      </div>
      {trailerUrl && <YouTube videoId={trailerUrl} opts={opts} />}
    </div>
  );
}

export default Row;
