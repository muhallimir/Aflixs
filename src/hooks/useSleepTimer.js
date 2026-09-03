// useSleepTimer: tracks an active countdown for the current choice.
// Cancels automatically when the document hides, the choice changes to "off",
// or the caller asks to stop.

import { useEffect, useRef, useState } from "react";
import {
  computeTimerSeconds,
  formatTimer,
  onSleepChanged,
} from "../utils/sleepTimer";

export default function useSleepTimer({ choice, runtimeMinutes, onExpire, active }) {
  const [seconds, setSeconds] = useState(() => {
    if (!active) return 0;
    const c = computeTimerSeconds(choice, runtimeMinutes);
    return c ? c.seconds : 0;
  });
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const tickRef = useRef(null);

  // Recompute the countdown whenever the choice, runtime, or active flag
  // changes so a fresh "start" replaces any prior partial countdown.
  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return undefined;
    }
    const c = computeTimerSeconds(choice, runtimeMinutes);
    setSeconds(c ? c.seconds : 0);
    return undefined;
  }, [choice, runtimeMinutes, active]);

  useEffect(() => {
    if (!active) return undefined;
    if (seconds <= 0) return undefined;
    if (choice === "off") return undefined;
    tickRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          try {
            onExpireRef.current && onExpireRef.current();
          } catch (e) {
            // ignore
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [seconds, active, choice]);

  // Pause when the tab is hidden so we don't burn the timer in the background.
  useEffect(() => {
    if (!active) return undefined;
    const onVis = () => {
      if (document.hidden) {
        if (tickRef.current) clearInterval(tickRef.current);
      } else if (seconds > 0 && choice !== "off") {
        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = setInterval(() => {
          setSeconds((prev) => Math.max(0, prev - 1));
        }, 1000);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [active, seconds, choice]);

  // Cancel when the choice is changed at runtime (the user picked Off).
  useEffect(() => {
    const off = onSleepChanged((id) => {
      if (id === "off" && active) setSeconds(0);
    });
    return off;
  }, [active]);

  return { seconds, formatted: formatTimer(seconds) };
}
