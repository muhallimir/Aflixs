import React from "react";
import { diff } from "./utils/compare";
import "./ComparePanel.css";

function ComparePanel({ a, b, onClose, onPick }) {
  if (!a || !b) return null;
  const result = diff(a, b);

  return (
    <div className="comparePanel" role="dialog" aria-label="Compare titles">
      <div className="comparePanel__head">
        <h2>Compare</h2>
        <button type="button" className="comparePanel__close" onClick={onClose} aria-label="Close compare">
          ×
        </button>
      </div>
      <div className="comparePanel__grid">
        <div className={`comparePanel__title ${result.overall === "a" ? "winner" : ""}`}>
          <h3>{a.title || a.name || "Title A"}</h3>
          {result.overall === "a" && <span className="comparePanel__winnerBadge">Winner</span>}
        </div>
        <div className={`comparePanel__title ${result.overall === "b" ? "winner" : ""}`}>
          <h3>{b.title || b.name || "Title B"}</h3>
          {result.overall === "b" && <span className="comparePanel__winnerBadge">Winner</span>}
        </div>
      </div>
      <table className="comparePanel__table">
        <caption className="srOnly">Side-by-side comparison</caption>
        <thead>
          <tr>
            <th scope="col">Field</th>
            <th scope="col">{a.title || a.name || "A"}</th>
            <th scope="col">{b.title || b.name || "B"}</th>
          </tr>
        </thead>
        <tbody>
          {result.fields.map((f) => (
            <tr key={f.key}>
              <th scope="row">{f.label}</th>
              <td className={f.winner === "a" ? "winner" : ""}>{f.a}</td>
              <td className={f.winner === "b" ? "winner" : ""}>{f.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="comparePanel__actions">
        <button type="button" onClick={() => onPick(a)}>Pick {a.title || a.name || "A"}</button>
        <button type="button" onClick={() => onPick(b)}>Pick {b.title || b.name || "B"}</button>
      </div>
    </div>
  );
}

export default ComparePanel;
