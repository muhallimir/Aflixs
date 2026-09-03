import React from "react";
import { formatSkip } from "./utils/skipControls";
import "./SkipControls.css";

function SkipControls({ intro, recap, onSkipIntro, onSkipRecap, dismissed }) {
  if (!intro && !recap) return null;
  return (
    <div className="skipControls" aria-label="Skip controls">
      {!dismissed?.intro && intro && (
        <button
          type="button"
          className="skipControls__btn skipControls__btn--intro"
          onClick={onSkipIntro}
          aria-label={`Skip intro ${formatSkip(intro)}`}
          title="Mocked: skip the intro"
        >
          <span className="skipControls__label">Skip intro</span>
          <span className="skipControls__time">{formatSkip(intro)}</span>
        </button>
      )}
      {!dismissed?.recap && recap && (
        <button
          type="button"
          className="skipControls__btn skipControls__btn--recap"
          onClick={onSkipRecap}
          aria-label={`Skip recap ${formatSkip(recap)}`}
          title="Mocked: skip the recap"
        >
          <span className="skipControls__label">Skip recap</span>
          <span className="skipControls__time">{formatSkip(recap)}</span>
        </button>
      )}
      <p className="skipControls__note" aria-label="Mock disclaimer">
        Buttons are mocked; nothing is skipped in this demo build.
      </p>
    </div>
  );
}

export default SkipControls;
