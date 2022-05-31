import React from "react";
import Nav from "../Nav";
import Banner from "../Banner";
import Row from "../Row";
import request from "../request";

function HomeScreen() {
  return (
    <div className="homeScreen">
      {/* navigation bar */}
      <Nav />
      {/* banner */}
      <Banner />
      <Row
        title="ORIGINALS"
        fetchUrl={request.fetchNetflixOriginals}
        isLargeRow
      />
      <Row title="Trending Now" fetchUrl={request.fetchTrending} />
      <Row title="Top Rated" fetchUrl={request.fetchTopRated} />
      <Row title="Action Movies" fetchUrl={request.fetchActionMovies} />
      <Row title="Comedy Movies" fetchUrl={request.fetchComedyMovies} />
      <Row title="Horror Movie" fetchUrl={request.fetchHorrorMovies} />
      <Row title="Romance Movies" fetchUrl={request.fetchRomanceMovies} />
      <Row title="Documentaries" fetchUrl={request.fetchDocumentaries} />
    </div>
  );
}

export default HomeScreen;
