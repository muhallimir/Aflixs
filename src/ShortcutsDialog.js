import React, { useEffect, useRef } from "react";
import { trapFocus } from "./utils/focusTrap";
import "./ShortcutsDialog.css";

const SHORTCUTS = [
  ["/", "Focus search"],
  ["Esc", "Close dialog / details"],
  ["Left / Right", "Move between titles in a row"],
  ["Enter / Space", "Open focused title"],
  ["?", "Open this help"],
];

function ShortcutsDialog({ onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    let release = () => {};
    try {
      release = trapFocus(dialogRef.current, document.activeElement);
    } catch (e) {
      // ignore
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      release();
    };
  }, [onClose]);

  return (
    <div className="shortcuts__overlay" onClick={onClose} role="presentation">
      <div
        className="shortcuts"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="shortcuts__close" onClick={onClose} aria-label="Close shortcuts" data-autofocus>
          X
        </button>
        <h2>Keyboard shortcuts</h2>
        <ul>
          {SHORTCUTS.map(([keys, desc]) => (
            <li key={keys}>
              <kbd>{keys}</kbd>
              <span>{desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ShortcutsDialog;
