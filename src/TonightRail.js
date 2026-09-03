import React, { useEffect, useMemo, useState } from "react";
import { pickTonight, explainRule, TONIGHT_LIMIT } from "./utils/tonight";
import { getRecentlyViewed, onRecentlyViewedChanged } from "./utils/recentlyViewed";
import "./TonightRail.css";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

function TonightRail({ myList, trending, onSelectTitle }) {
  const [recent, setRecent] = useState(() => {
    try {
      return getRecentlyViewed();
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    let off = () => {};
    try {
      off = onRecentlyViewedChanged(() => {
        try {
          setRecent(getRecentlyViewed());
        } catch (e) {
          setRecent([]);
        }
      });
    } catch (e) {
      // ignore
    }
    return off;
  }, []);

  const picks = useMemo(
    () => pickTonight({ myList: myList || [], trending: trending || [], recentlyViewed: recent || [] }),
    [myList, trending, recent]
  );

  const hasMyList = Array.isArray(myList) && myList.length > 0;

  return (
    <section className="tonightRail" aria-label="Tonight on Aflixs">
      <div className="tonightRail__head">
        <h2>Tonight on Aflixs</h2>
        <small className="tonightRail__sub">Personal picks refreshed daily.</small>
      </div>
      {picks.length === 0 ? (
        <div className="tonightRail__empty" role="status">
          <p>
            Your Tonight lineup will fill in once you add a few titles to{" "}
            <strong>My List</strong> or open a movie in the detail modal.
          </p>
          {!hasMyList && (
            <p className="tonightRail__hint">
              Tip: open any title and tap <em>+ My List</em> to seed it.
            </p>
          )}
        </div>
      ) : (
        <div className="tonightRail__track">
          {picks.map((p) => {
            const img = p.backdrop_path || p.poster_path;
            return (
              <button
                key={`${p.source}-${p.id}`}
                className="tonightRail__card"
                onClick={() => onSelectTitle && onSelectTitle(p)}
                aria-label={`View details for ${p.title}. ${explainRule(p.rule)}`}
              >
                <span
                  className="tonightRail__why"
                  title={explainRule(p.rule)}
                  aria-label={`Why this: ${explainRule(p.rule)}`}
                >
                  Why this?
                  <span className="tonightRail__whyTip">{explainRule(p.rule)}</span>
                </span>
                {img ? (
                  <img src={`${IMG_BASE}${img}`} alt={p.title} loading="lazy" />
                ) : (
                  <span className="tonightRail__fallback" aria-hidden="true">
                    {String(p.title || "?").slice(0, 1)}
                  </span>
                )}
                <span className="tonightRail__name">{p.title}</span>
                <span className="tonightRail__source">{p.source}</span>
              </button>
            );
          })}
          {picks.length < TONIGHT_LIMIT &&
            Array.from({ length: TONIGHT_LIMIT - picks.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="tonightRail__card tonightRail__card--empty"
                aria-hidden="true"
              >
                <span>?</span>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}

export default TonightRail;
