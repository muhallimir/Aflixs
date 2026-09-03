import React, { useCallback, useEffect, useState } from "react";
import { getRating, setRating, onRatingsChanged } from "../utils/ratings";
import "./StarRating.css";

function StarRating({ titleId, size }) {
  const [value, setValue] = useState(() => {
    try {
      return getRating(titleId);
    } catch (e) {
      return 0;
    }
  });

  const refresh = useCallback(() => {
    try {
      setValue(getRating(titleId));
    } catch (e) {
      setValue(0);
    }
  }, [titleId]);

  useEffect(() => {
    refresh();
    let off = () => {};
    try {
      off = onRatingsChanged(refresh);
    } catch (e) {
      // ignore
    }
    return off;
  }, [refresh]);

  if (titleId == null) return null;

  return (
    <div
      className="starRating"
      role="radiogroup"
      aria-label="Rate this title from 1 to 5 stars"
      style={size ? { fontSize: size } : undefined}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
          className={`starRating__star ${n <= value ? "lit" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            try {
              setRating(titleId, n);
            } catch (err) {
              // ignore
            }
            refresh();
          }}
        >
          {"\u2605"}
        </button>
      ))}
      {value > 0 && (
        <span className="starRating__value" aria-live="polite">
          {value}/5
        </span>
      )}
    </div>
  );
}

export default StarRating;
