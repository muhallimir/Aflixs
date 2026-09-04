import React, { useEffect, useState } from "react";
import Nav from "../Nav";
import Banner from "../Banner";
import Row from "../Row";
import Top10Row from "../Top10Row";
import TrendingRail from "../TrendingRail";
import RatedRail from "../RatedRail";
import RecentlyViewedRail from "../RecentlyViewedRail";
import RecommendationsRail from "../RecommendationsRail";
import DownloadsRail from "../DownloadsRail";
import ContinueWatchingRow from "../ContinueWatchingRow";
import TonightRail from "../TonightRail";
import TrailerHistoryRail from "../TrailerHistoryRail";
import ComingSoonRail from "../ComingSoonRail";
import TimeLimitBanner from "../TimeLimitBanner";
import Footer from "../Footer";
import request from "../request";
import { TMDB_API_KEY } from "../request";
import axios from "../axios";
import { useSelector } from "react-redux";
import { selectMyList } from "../features/myListSlice";
import { setPageMeta } from "../utils/seo";
import DemoBanner from "../DemoBanner";
import { isDemoMode, getMockCatalog } from "../utils/mockCatalog";

function HomeScreen({ onSelectTitle }) {
  const myList = useSelector(selectMyList);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (isDemoMode()) {
          if (!cancelled) setTrending(getMockCatalog().slice(0, 12));
          return;
        }
        const res = await axios.get(
          `/trending/all/week?api_key=${TMDB_API_KEY}&language=en-US`
        );
        if (!cancelled) setTrending(res.data.results || []);
      } catch (e) {
        if (!cancelled) setTrending(getMockCatalog().slice(0, 12));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPageMeta({
      title: "Home",
      description: "Watch trending movies and TV shows on Aflixs. Top 10, My List, and continue watching.",
      path: "/",
    });
  }, []);

  return (
    <div className="homeScreen">
      {/* navigation bar */}
      <Nav />
      <TimeLimitBanner />
      {isDemoMode() && <DemoBanner />}
      {/* banner */}
      <Banner onSelectTitle={onSelectTitle} />
      <Top10Row onSelectTitle={onSelectTitle} />
      <ContinueWatchingRow onSelectTitle={onSelectTitle} />
      <TonightRail
        myList={myList}
        trending={trending}
        onSelectTitle={onSelectTitle}
      />
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
      <TrendingRail onSelectTitle={onSelectTitle} />
      <TrailerHistoryRail onSelectTitle={onSelectTitle} />
      <RecentlyViewedRail onSelectTitle={onSelectTitle} />
      <RecommendationsRail onSelectTitle={onSelectTitle} />
      <DownloadsRail onSelectTitle={onSelectTitle} />
      <ComingSoonRail onSelectTitle={onSelectTitle} />
      <RatedRail onSelectTitle={onSelectTitle} />
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
