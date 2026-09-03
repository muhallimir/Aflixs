import React, { useMemo } from "react";
import { getSoundtrack, getSoundtrackLabel } from "./utils/soundtrack";
import "./SoundtrackRail.css";

function SoundtrackRail({ movie }) {
  const tracks = useMemo(
    () => getSoundtrack(movie),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [movie?.id, movie?.media_type]
  );
  if (!movie || tracks.length === 0) return null;
  return (
    <section className="soundtrack" aria-label="Soundtrack">
      <h3>Soundtrack</h3>
      <ul className="soundtrack__list">
        {tracks.map((t) => (
          <li key={t.id} className="soundtrack__row">
            <span className="soundtrack__num" aria-hidden="true">
              {"\u266B"}
            </span>
            <div className="soundtrack__meta">
              <strong>{t.title}</strong>
              <small>
                {t.artist} &middot; {t.duration}
              </small>
            </div>
            <a
              className="soundtrack__play"
              href={t.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Play ${t.title} by ${t.artist} on YouTube`}
            >
              Play on YouTube
            </a>
          </li>
        ))}
      </ul>
      <p className="soundtrack__note" aria-label="Mock soundtrack disclaimer">
        {getSoundtrackLabel()}
      </p>
    </section>
  );
}

export default SoundtrackRail;
