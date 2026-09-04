import React, { useEffect, useState } from "react";
import { buildWeekendEvents, getEvents, setEvents, getReminders, toggleReminder, onComingSoonChanged } from "./utils/comingSoon";
import { getMockCatalog } from "./utils/mockCatalog";
import "./ComingSoonRail.css";

const COLORS = ["#7c3aed", "#0ea5e9", "#e50914", "#16a34a"];

function ComingSoonRail({ onSelectTitle }) {
  const [events, setLocalEvents] = useState(() => {
    const stored = getEvents();
    if (stored.length) return stored;
    return buildWeekendEvents(getMockCatalog().slice(0, 4));
  });
  const [reminders, setLocalReminders] = useState(() => getReminders());

  useEffect(() => {
    // Persist initial mock schedule so other views can read the same dates.
    setEvents(events);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const off = onComingSoonChanged(({ events: ev, reminders: rm }) => {
      setLocalEvents(ev);
      setLocalReminders(rm);
    });
    return off;
  }, []);

  return (
    <div className="csRail" data-testid="coming-soon-rail">
      <h2 className="csRail__title">Coming this month</h2>
      <p className="csRail__sub">Tap "Remind me" to get a notification when a title drops.</p>
      <div className="csRail__scroller" role="list">
        {events.map((ev, i) => {
          const reminded = Boolean(reminders[ev.id]);
          return (
            <article
              key={ev.id}
              className="csCard"
              role="listitem"
              style={{ background: ev.title?.mockColor || COLORS[i % COLORS.length] }}
            >
              <div className="csCard__date">{ev.label}</div>
              <h3 className="csCard__title">{ev.title?.title || "Title TBA"}</h3>
              <p className="csCard__overview">
                {(ev.title?.overview || "Drop date coming soon.").slice(0, 110)}
              </p>
              <div className="csCard__actions">
                <button
                  type="button"
                  className="csCard__remind"
                  aria-pressed={reminded}
                  onClick={() => setLocalReminders(toggleReminder(ev.id))}
                >
                  {reminded ? "Reminder set" : "Remind me"}
                </button>
                {ev.title && (
                  <button
                    type="button"
                    className="csCard__open"
                    onClick={() => onSelectTitle && onSelectTitle(ev.title)}
                  >
                    Open
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default ComingSoonRail;
