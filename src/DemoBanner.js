import React from "react";
import "./DemoBanner.css";

function DemoBanner() {
  return (
    <div className="demoBanner" role="status">
      <span className="demoBanner__badge">Demo</span>
      <p>
        You are browsing built-in demo titles (no TMDB key configured). Add{" "}
        <code>REACT_APP_TMDB_API_KEY</code> to <code>.env.local</code> for live data. See{" "}
        <code>.env.example</code>.
      </p>
    </div>
  );
}

export default DemoBanner;
