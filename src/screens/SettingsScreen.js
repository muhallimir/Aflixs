import React, { useEffect, useState } from "react";
import Nav from "../Nav";
import Footer from "../Footer";
import { getPrefs, setPrefs, DEFAULT_PREFS } from "../utils/prefs";
import { clearRatings } from "../utils/ratings";
import { clearRecentlyViewed } from "../utils/recentlyViewed";
import { clearDownloads } from "../utils/downloads";
import { clearContinueWatching } from "../utils/continueWatching";
import { clearList } from "../features/myListSlice";
import { useDispatch } from "react-redux";
import { setPageMeta } from "../utils/seo";
import { getSleepChoice, setSleepChoice, SLEEP_OPTIONS } from "../utils/sleepTimer";
import {
  getTimeLimit,
  setTimeLimit,
  getUsedToday,
  resetToday,
  onTimeLimitChanged,
} from "../utils/timeLimit";
import "./SettingsScreen.css";

const LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "id-ID", label: "Indonesian" },
];

function SettingsScreen() {
  const dispatch = useDispatch();
  const [prefs, setPrefsState] = useState(() => {
    try {
      return getPrefs();
    } catch (e) {
      return { ...DEFAULT_PREFS };
    }
  });
  const [sleepId, setSleepId] = useState(() => {
    try {
      return getSleepChoice();
    } catch (e) {
      return "off";
    }
  });
  const [timeLimit, setTimeLimitState] = useState(() => {
    try {
      return getTimeLimit();
    } catch (e) {
      return 0;
    }
  });
  const [usedToday, setUsedToday] = useState(() => {
    try {
      return getUsedToday();
    } catch (e) {
      return 0;
    }
  });
  const [resetMsg, setResetMsg] = useState("");

  useEffect(() => {
    setPageMeta({ title: "Settings", description: "Aflixs playback and content settings.", path: "/settings" });
  }, []);

  useEffect(() => {
    const off = onTimeLimitChanged((s) => {
      setTimeLimitState(s.limit);
      setUsedToday(s.used);
    });
    return off;
  }, []);

  const update = (patch) => {
    try {
      setPrefsState(setPrefs(patch));
    } catch (e) {
      // ignore
    }
  };

  const handleResetDemo = () => {
    try {
      clearRatings();
      clearRecentlyViewed();
      clearDownloads();
      clearContinueWatching();
      dispatch(clearList());
      setPrefsState(setPrefs({ ...DEFAULT_PREFS }));
      setSleepId(setSleepChoice("off"));
      setResetMsg("Demo data cleared. My List, history, ratings, downloads and settings were reset.");
    } catch (e) {
      setResetMsg("Could not reset everything. Please try again.");
    }
  };

  return (
    <div className="settingsScreen">
      <Nav />
      <div className="settingsScreen__body">
        <h1>Settings</h1>

        <section className="settingsScreen__card" aria-label="Playback">
          <h2>Playback</h2>
          <label className="settingsScreen__row">
            <span>
              <strong>Autoplay trailers</strong>
              <small>Play trailers automatically in the detail modal.</small>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.autoplayTrailers}
              className={`settingsScreen__switch ${prefs.autoplayTrailers ? "on" : ""}`}
              onClick={() => update({ autoplayTrailers: !prefs.autoplayTrailers })}
              aria-label="Toggle autoplay trailers"
            >
              <span />
            </button>
          </label>
          <label className="settingsScreen__row">
            <span>
              <strong>Language</strong>
              <small>Preferred language for TMDB results.</small>
            </span>
            <select
              value={prefs.language}
              onChange={(e) => update({ language: e.target.value })}
              aria-label="Preferred language"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="settingsScreen__row">
            <span>
              <strong>Sleep timer</strong>
              <small>Default countdown when opening the detail modal.</small>
            </span>
            <div className="settingsScreen__radioGroup" role="radiogroup" aria-label="Sleep timer">
              {SLEEP_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={sleepId === o.id}
                  className={`settingsScreen__radio ${sleepId === o.id ? "on" : ""}`}
                  onClick={() => setSleepId(setSleepChoice(o.id))}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </label>
        </section>

        <section className="settingsScreen__card" aria-label="Content controls">
          <h2>Content controls</h2>
          <label className="settingsScreen__row">
            <span>
              <strong>Kids Mode</strong>
              <small>Only family and animation titles, adult-flagged hidden.</small>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.kidsMode}
              className={`settingsScreen__switch ${prefs.kidsMode ? "on" : ""}`}
              onClick={() => update({ kidsMode: !prefs.kidsMode })}
              aria-label="Toggle kids mode"
            >
              <span />
            </button>
          </label>
          <div className="settingsScreen__row">
            <span>
              <strong>Maturity level</strong>
              <small>Filter rows and recommendations by maturity badge.</small>
            </span>
            <div className="settingsScreen__radioGroup" role="radiogroup" aria-label="Maturity level">
              {[
                { v: "all", label: "All" },
                { v: "pg", label: "PG-13 max" },
                { v: "kids", label: "Kids" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  role="radio"
                  aria-checked={prefs.maturityLevel === o.v}
                  className={`settingsScreen__radio ${prefs.maturityLevel === o.v ? "on" : ""}`}
                  onClick={() => update({ maturityLevel: o.v })}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="settingsScreen__card" aria-label="Parental controls">
          <h2>Parental controls</h2>
          <label className="settingsScreen__row">
            <span>
              <strong>Daily time limit</strong>
              <small>
                {timeLimit > 0
                  ? `Used ${usedToday} of ${timeLimit} minutes today.`
                  : "Off. Set a per-day minute budget for this profile."}
              </small>
            </span>
            <div className="settingsScreen__radioGroup" role="radiogroup" aria-label="Daily time limit">
              {[0, 30, 60, 120, 180].map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={timeLimit === m}
                  className={`settingsScreen__radio ${timeLimit === m ? "on" : ""}`}
                  onClick={() => setTimeLimitState(setTimeLimit(m))}
                >
                  {m === 0 ? "Off" : `${m}m`}
                </button>
              ))}
            </div>
          </label>
          {timeLimit > 0 && (
            <button
              type="button"
              className="settingsScreen__ghost"
              onClick={() => {
                resetToday();
                setUsedToday(0);
              }}
            >
              Reset today's usage
            </button>
          )}
        </section>

        <section className="settingsScreen__card" aria-label="Demo data">
          <h2>Demo data</h2>
          <p className="settingsScreen__muted">
            Clears this profile&apos;s My List, watch history, ratings, downloads and
            recently-viewed, and restores default settings.
          </p>
          <button className="settingsScreen__danger" onClick={handleResetDemo}>
            Reset demo data
          </button>
          {resetMsg && (
            <p className="settingsScreen__resetMsg" role="status">
              {resetMsg}
            </p>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}

export default SettingsScreen;
