import React from "react";
import { getMaturity } from "../utils/maturity";
import "./MaturityBadge.css";

function MaturityBadge({ movie }) {
  if (!movie) return null;
  const { badge } = getMaturity(movie);
  return (
    <span className="maturityBadge" title={`Maturity rating ${badge}`}>
      {badge}
    </span>
  );
}

export default MaturityBadge;
