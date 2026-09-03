import React from "react";
import "./SleepTimerBadge.css";

function SleepTimerBadge({ formatted, label, onCancel }) {
  if (!formatted || formatted === "0:00") return null;
  return (
    <div className="sleepBadge" role="status" aria-live="polite">
      <span className="sleepBadge__time" aria-hidden="true">
        {"\u23F2\uFE0F"}
      </span>
      <span className="sleepBadge__label">
        Sleep timer <strong>{formatted}</strong>
        {label && <small> &middot; {label}</small>}
      </span>
      <button
        type="button"
        className="sleepBadge__cancel"
        onClick={onCancel}
        aria-label="Cancel sleep timer"
      >
        Cancel
      </button>
    </div>
  );
}

export default SleepTimerBadge;
