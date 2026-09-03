import React from "react";
import Nav from "../Nav";
import Banner from "../Banner";
import Row from "../Row";
import Top10Row from "../Top10Row";
import ContinueWatchingRow from "../ContinueWatchingRow";
import Footer from "../Footer";
import request from "../request";
import { useSelector } from "react-redux";
import { selectMyList } from "../features/myListSlice";

function HomeScreen({ onSelectTitle }) {
  const myList = useSelector(selectMyList);

  return (
    <div className="homeScreen">
      {/* navigation bar */}
      <Nav />
      {/* banner */}
      <Banner onSelectTitle={onSelectTitle} />
      <Top10Row onSelectTitle={onSelectTitle} />
      <ContinueWatchingRow onSelectTitle={onSelectTitle} />
      {myList.length > 0 && (
        <Row
          title="My List"
          moviesOverride={myList}
          isLargeRow
          onSelectTitle={onSelectTitle}
        />
      )}
      <Row
        title="ORIGINALS"
        fetchUrl={request.fetchNetflixOriginals}
        isLargeRow
        onSelectTitle={onSelectTitle}
      />
      <Row title="Trending Now" fetchUrl={request.fetchTrending} onSelectTitle={onSelectTitle} />
      <Row title="Top Rated" fetchUrl={request.fetchTopRated} onSelectTitle={onSelectTitle} />
      <Row title="Action Movies" fetchUrl={request.fetchActionMovies} onSelectTitle={onSelectTitle} />
      <Row title="Comedy Movies" fetchUrl={request.fetchComedyMovies} onSelectTitle={onSelectTitle} />
      <Row title="Horror Movie" fetchUrl={request.fetchHorrorMovies} onSelectTitle={onSelectTitle} />
      <Row title="Romance Movies" fetchUrl={request.fetchRomanceMovies} onSelectTitle={onSelectTitle} />
      <Row title="Documentaries" fetchUrl={request.fetchDocumentaries} onSelectTitle={onSelectTitle} />
      <Footer />
    </div>
  );
}

export default HomeScreen;
