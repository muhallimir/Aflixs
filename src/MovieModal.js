import React, { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import movieTrailer from "movie-trailer";
import axios from "./axios";
import { TMDB_API_KEY } from "./request";
import { useDispatch, useSelector } from "react-redux";
import { toggleListItem } from "./features/myListSlice";
import { saveContinueWatching } from "./utils/continueWatching";
import StarRating from "./StarRating";
import MaturityBadge from "./MaturityBadge";
import { getYear, getContentAdvisories } from "./utils/maturity";
import { addDownload, isDownloaded, removeDownload, onDownloadsChanged, DOWNLOAD_QUOTA } from "./utils/downloads";
import { trapFocus } from "./utils/focusTrap";
import { buildRoomId, buildInviteUrl, readRoomFromUrl } from "./utils/watchParty";
import { recordTrailerWatch } from "./utils/trailerHistory";
import WatchPartyPanel from "./WatchPartyPanel";
import {
  getSleepChoice,
  setSleepChoice,
  computeTimerSeconds,
  formatTimer,
} from "./utils/sleepTimer";
import SleepTimerBadge from "./SleepTimerBadge";
import { computeSkipTargets } from "./utils/skipControls";
import SkipControls from "./SkipControls";
import SoundtrackRail from "./SoundtrackRail";
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

function getMediaType(movie) {
  if (movie?.media_type === "tv" || movie?.media_type === "movie") return movie.media_type;
  if (movie?.first_air_date && !movie?.release_date) return "tv";
  if (movie?.name && !movie?.title) return "tv";
  return "movie";
}

function getRuntimeMinutes(movie) {
  if (!movie) return 0;
  if (typeof movie.runtime === "number" && movie.runtime > 0) return movie.runtime;
  if (Array.isArray(movie.episode_run_time) && movie.episode_run_time[0]) {
    return movie.episode_run_time[0];
  }
  if (typeof movie.episode_run_time === "number" && movie.episode_run_time > 0) {
    return movie.episode_run_time;
  }
  return 0;
}

function MovieModal({ movie, onClose, onSelectTitle, onCompare }) {
  const [trailerUrl, setTrailerUrl] = useState("");
  const [trailerError, setTrailerError] = useState("");
  const [similar, setSimilar] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [cast, setCast] = useState([]);
  const [castLoading, setCastLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [expandedReview, setExpandedReview] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [dlMsg, setDlMsg] = useState("");
  const [partyOpen, setPartyOpen] = useState(false);
  const [partyInviteCopied, setPartyInviteCopied] = useState(false);
  const [sleepChoice, setSleepChoiceState] = useState(() => {
    try {
      return getSleepChoice();
    } catch (e) {
      return "off";
    }
  });
  const [sleepSeconds, setSleepSeconds] = useState(0);
  const [skipDismissed, setSkipDismissed] = useState({});
  const dialogRef = useRef(null);
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
    setCast([]);
    setReviews([]);
    setExpandedReview(null);
    setCopied(false);
    setDlMsg("");
    setPartyOpen(false);
    setPartyInviteCopied(false);
    setSleepSeconds(0);
    setSkipDismissed({});
    try {
      setSleepChoiceState(getSleepChoice());
    } catch (e) {
      setSleepChoiceState("off");
    }
    try {
      setDownloaded(isDownloaded(movie?.id));
    } catch (e) {
      setDownloaded(false);
    }
    // Auto-open the watch party if the URL carries a matching ?room=...
    try {
      const urlRoom = readRoomFromUrl();
      const localRoom = buildRoomId(movie);
      if (urlRoom && localRoom && urlRoom === localRoom) {
        setPartyOpen(true);
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Focus trap: keep keyboard inside the dialog, restore focus on close.
    let release = () => {};
    try {
      release = trapFocus(dialogRef.current, document.activeElement);
    } catch (e) {
      // ignore
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      release();
    };
  }, [movie, onClose]);

  // Keep download state in sync (quota changes elsewhere).
  useEffect(() => {
    let off = () => {};
    try {
      off = onDownloadsChanged(() => {
        try {
          setDownloaded(isDownloaded(movie?.id));
        } catch (e) {
          // ignore
        }
      });
    } catch (e) {
      // ignore
    }
    return off;
  }, [movie?.id]);

  // Sleep timer countdown. Resets whenever the modal closes (via the
  // movie?.id reset effect above), and is canceled by setting sleepChoice
  // to "off" or by clicking Cancel on the badge.
  useEffect(() => {
    if (!movie) return undefined;
    if (sleepChoice === "off") {
      setSleepSeconds(0);
      return undefined;
    }
    const runtime = getRuntimeMinutes(movie);
    const initial = computeTimerSeconds(sleepChoice, runtime);
    if (!initial || initial.seconds <= 0) {
      setSleepSeconds(0);
      return undefined;
    }
    setSleepSeconds(initial.seconds);
    const tick = setInterval(() => {
      setSleepSeconds((prev) => {
        if (prev <= 1) {
          try {
            onClose && onClose();
          } catch (e) {
            // ignore
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
    // onClose is captured via the parent prop and intentionally not in
    // the deps; this effect re-runs whenever sleep choice / movie changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie?.id, sleepChoice]);

  // Fetch similar titles + top cast.
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
    async function fetchCast() {
      setCastLoading(true);
      try {
        const type = getMediaType(movie);
        const res = await axios.get(
          `/${type}/${movie.id}/credits?api_key=${TMDB_API_KEY}&language=en-US`
        );
        if (!cancelled) setCast((res.data.cast || []).slice(0, 8));
      } catch (err) {
        if (!cancelled) setCast([]);
      } finally {
        if (!cancelled) setCastLoading(false);
      }
    }
    async function fetchReviews() {
      setReviewsLoading(true);
      try {
        const type = getMediaType(movie);
        const res = await axios.get(
          `/${type}/${movie.id}/reviews?api_key=${TMDB_API_KEY}&language=en-US&page=1`
        );
        if (!cancelled) setReviews((res.data.results || []).slice(0, 5));
      } catch (err) {
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    }
    fetchSimilar();
    fetchCast();
    fetchReviews();
    return () => {
      cancelled = true;
    };
  }, [movie]);

  if (!movie) return null;

  const title = getTitle(movie);
  const year = getYear(movie);
  const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : "NR";
  const advisories = getContentAdvisories(movie);
  const skipTargets = computeSkipTargets(getRuntimeMinutes(movie));

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
        try {
          recordTrailerWatch(movie);
        } catch (e) {
          // ignore
        }
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="movieModal__close" onClick={onClose} aria-label="Close details" data-autofocus>
          X
        </button>
        <SleepTimerBadge
          formatted={formatTimer(sleepSeconds)}
          label={
            sleepChoice === "eot"
              ? "End of title"
              : sleepChoice !== "off"
              ? `${sleepChoice} min`
              : null
          }
          onCancel={() => setSleepChoiceState(setSleepChoice("off"))}
        />
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
            {movie.poster_path ? (
              <img
                className="movieModal__poster"
                src={`${IMG_BASE}${movie.poster_path}`}
                alt={`${title} poster`}
              />
            ) : (
              <span
                className="movieModal__posterFallback"
                style={{ background: movie.mockColor || "#333" }}
                aria-hidden="true"
              >
                {String(title).slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="movieModal__info">
              <h2 className="movieModal__title">{title}</h2>
              <p className="movieModal__meta">
                <span className="movieModal__rating">{rating} / 10</span>
                {year && <span> | {year}</span>}
                <span> | {getMediaType(movie).toUpperCase()}</span>
                {movie.original_language && (
                  <span> | {String(movie.original_language).toUpperCase()}</span>
                )}{" "}
                <MaturityBadge movie={movie} />
              </p>
              {advisories.length > 0 && (
                <p className="movieModal__advisories" aria-label="Content advisories">
                  Advisories: {advisories.join(" | ")}
                </p>
              )}
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
                <button
                  className="movieModal__btn"
                  onClick={() => {
                    try {
                      if (downloaded) {
                        removeDownload(movie.id);
                        setDownloaded(false);
                        setDlMsg("");
                      } else {
                        const res = addDownload(movie);
                        if (res.ok) {
                          setDownloaded(true);
                          setDlMsg("");
                        } else {
                          setDlMsg(`Download limit reached (${DOWNLOAD_QUOTA}). Remove one first.`);
                        }
                      }
                    } catch (e) {
                      setDlMsg("Downloads are unavailable right now.");
                    }
                  }}
                  aria-label={downloaded ? "Remove download" : "Download for offline"}
                >
                  {downloaded ? "Downloaded ✓" : "Download"}
                </button>
                <button
                  className="movieModal__btn"
                  onClick={() => {
                    const type = getMediaType(movie);
                    const link = `${window.location.origin}/?title=${type}-${movie.id}`;
                    const done = () => setCopied(true);
                    try {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(link).then(done).catch(() => {
                          fallbackCopy(link);
                          done();
                        });
                      } else {
                        fallbackCopy(link);
                        done();
                      }
                    } catch (e) {
                      fallbackCopy(link);
                      done();
                    }
                    function fallbackCopy(text) {
                      try {
                        const ta = document.createElement("textarea");
                        ta.value = text;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand("copy");
                        document.body.removeChild(ta);
                      } catch (err) {
                        // ignore
                      }
                    }
                  }}
                  aria-label="Copy shareable link to this title"
                >
                  {copied ? "Link copied!" : "Copy link"}
                </button>
                <button
                  className="movieModal__btn"
                  onClick={() => {
                    try {
                      const room = buildRoomId(movie);
                      const invite = buildInviteUrl(room);
                      if (!invite) return;
                      const done = () => setPartyInviteCopied(true);
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(invite).then(done).catch(() => {
                          fallbackPartyCopy(invite);
                          done();
                        });
                      } else {
                        fallbackPartyCopy(invite);
                        done();
                      }
                      function fallbackPartyCopy(text) {
                        try {
                          const ta = document.createElement("textarea");
                          ta.value = text;
                          document.body.appendChild(ta);
                          ta.select();
                          document.execCommand("copy");
                          document.body.removeChild(ta);
                        } catch (err) {
                          // ignore
                        }
                      }
                      setPartyOpen(true);
                      setTimeout(() => setPartyInviteCopied(false), 1800);
                    } catch (e) {
                      // ignore
                    }
                  }}
                  aria-label="Open watch party and copy invite link"
                  title="Open a watch-party room and copy its invite link"
                >
                  {partyInviteCopied ? "Invite copied" : "Watch party"}
                </button>
                <select
                  className="movieModal__select"
                  value={sleepChoice}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSleepChoiceState(setSleepChoice(id));
                  }}
                  aria-label="Sleep timer"
                  title="Sleep timer"
                >
                  <option value="off">Sleep timer: Off</option>
                  <option value="15">Sleep timer: 15 minutes</option>
                  <option value="30">Sleep timer: 30 minutes</option>
                  <option value="60">Sleep timer: 60 minutes</option>
                  <option value="eot">Sleep timer: End of title</option>
                </select>
                <button
                  className="movieModal__btn"
                  onClick={() => onCompare && onCompare(movie)}
                  title="Open side-by-side compare"
                  aria-label="Compare this title with another"
                >
                  Compare
                </button>
              </div>
              <SkipControls
                intro={skipTargets.hasIntro ? skipTargets.intro : 0}
                recap={skipTargets.hasRecap ? skipTargets.recap : 0}
                dismissed={skipDismissed}
                onSkipIntro={() => setSkipDismissed((d) => ({ ...d, intro: true }))}
                onSkipRecap={() => setSkipDismissed((d) => ({ ...d, recap: true }))}
              />
              <div className="movieModal__rateRow">
                <span className="movieModal__rateLabel">Your rating:</span>
                <StarRating titleId={movie.id} />
              </div>
              {trailerError && <p className="movieModal__error">{trailerError}</p>}
              {dlMsg && <p className="movieModal__error">{dlMsg}</p>}
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

          <div className="movieModal__cast">
            <h3>Top cast</h3>
            {castLoading && <p className="movieModal__muted">Loading cast...</p>}
            {!castLoading && cast.length === 0 && (
              <p className="movieModal__muted">Cast info is not available for this title.</p>
            )}
            {cast.length > 0 && (
              <div className="movieModal__castRow">
                {cast.map((person) => (
                  <div key={person.cast_id || person.credit_id || person.id} className="movieModal__castCard">
                    {person.profile_path ? (
                      <img
                        src={`${IMG_BASE}${person.profile_path}`}
                        alt={person.name}
                        loading="lazy"
                      />
                    ) : (
                      <span className="movieModal__castFallback" aria-hidden="true">
                        {String(person.name || "?")
                          .split(" ")
                          .map((w) => w.slice(0, 1))
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    )}
                    <span className="movieModal__castName">{person.name}</span>
                    {person.character && (
                      <span className="movieModal__castChar">{person.character}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="movieModal__reviews">
            <h3>Reviews</h3>
            {reviewsLoading && <p className="movieModal__muted">Loading reviews...</p>}
            {!reviewsLoading && reviews.length === 0 && (
              <p className="movieModal__muted">No reviews yet. Be the first to rate this title below.</p>
            )}
            {reviews.map((r) => {
              const expanded = expandedReview === r.id;
              const body = r.content || "";
              const clipped = body.length > 220 && !expanded;
              return (
                <article key={r.id} className="movieModal__review">
                  <header className="movieModal__reviewHead">
                    <span className="movieModal__reviewAuthor">{r.author || "Anonymous"}</span>
                    {r.author_details?.rating != null && (
                      <span className="movieModal__reviewScore">
                        {r.author_details.rating}/10
                      </span>
                    )}
                  </header>
                  <p className="movieModal__reviewBody">
                    {clipped ? `${body.slice(0, 220)}...` : body}
                  </p>
                  {body.length > 220 && (
                    <button
                      className="movieModal__reviewToggle"
                      onClick={() => setExpandedReview(expanded ? null : r.id)}
                      aria-expanded={expanded}
                    >
                      {expanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          <SoundtrackRail movie={movie} />

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
        <WatchPartyPanel
          movie={movie}
          open={partyOpen}
          onClose={() => setPartyOpen(false)}
        />
      </div>
    </div>
  );
}

export default MovieModal;
