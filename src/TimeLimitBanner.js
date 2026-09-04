import React, { useEffect, useState } from "react";
import { getTimeLimit, setTimeLimit, getUsedToday, isOverBudget, onTimeLimitChanged } from "./utils/timeLimit";
import "./TimeLimitBanner.css";

function TimeLimitBanner() {
  const [limit, setLimit] = useState(() => getTimeLimit());
  const [used, setUsed] = useState(() => getUsedToday());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const off = onTimeLimitChanged((s) => {
      setLimit(s.limit);
      setUsed(s.used);
      if (!s.over) setDismissed(false);
    });
    return off;
  }, []);

  if (!limit || limit <= 0) return null;
  if (!isOverBudget()) return null;
  if (dismissed) return null;

  return (
    <div className="timeLimitBanner" role="alert" aria-live="polite">
      <div className="timeLimitBanner__copy">
        <strong>Take a break.</strong> You've used {used} of your {limit}-minute
        daily limit.
      </div>
      <div className="timeLimitBanner__actions">
        <button
          type="button"
          className="timeLimitBanner__dismiss"
          onClick={() => setDismissed(true)}
        >
          Keep watching
        </button>
        <button
          type="button"
          className="timeLimitBanner__bump"
          onClick={() => {
            const next = Math.min(720, (limit || 0) + 30);
            setTimeLimit(next);
          }}
        >
          +30 min
        </button>
      </div>
    </div>
  );
}

export default TimeLimitBanner;
