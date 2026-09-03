// Tests for the sleep timer pure logic.

import {
  SLEEP_OPTIONS,
  getSleepChoice,
  setSleepChoice,
  computeTimerSeconds,
  formatTimer,
} from "../utils/sleepTimer";
import * as profiles from "../utils/profiles";

describe("sleepTimer utils", () => {
  beforeEach(() => {
    localStorage.clear();
    profiles.switchProfile("p_sleep");
  });

  test("SLEEP_OPTIONS exposes the documented choices", () => {
    const ids = SLEEP_OPTIONS.map((o) => o.id);
    expect(ids).toEqual(["off", "15", "30", "60", "eot"]);
  });

  test("default choice is off when nothing is stored", () => {
    expect(getSleepChoice()).toBe("off");
  });

  test("setSleepChoice persists and ignores unknown ids", () => {
    setSleepChoice("30");
    expect(getSleepChoice()).toBe("30");
    setSleepChoice("not-a-real-id");
    expect(getSleepChoice()).toBe("30");
  });

  test("computeTimerSeconds returns null when off", () => {
    expect(computeTimerSeconds("off", 120)).toBeNull();
  });

  test("computeTimerSeconds returns the minutes for fixed choices", () => {
    expect(computeTimerSeconds("15", 0).seconds).toBe(15 * 60);
    expect(computeTimerSeconds("30", 0).seconds).toBe(30 * 60);
    expect(computeTimerSeconds("60", 0).seconds).toBe(60 * 60);
    expect(computeTimerSeconds("15", 0).label).toBe("15 minutes");
  });

  test("computeTimerSeconds returns runtime minus elapsed for End-of-title", () => {
    const out = computeTimerSeconds("eot", 100, 600); // 100 min, 10 min in
    expect(out.label).toBe("Ends with title");
    expect(out.seconds).toBe(90 * 60);
  });

  test("computeTimerSeconds clamps end-of-title to zero when elapsed exceeds runtime", () => {
    const out = computeTimerSeconds("eot", 30, 60 * 30);
    expect(out.seconds).toBe(0);
  });

  test("formatTimer renders mm:ss and hh:mm:ss", () => {
    expect(formatTimer(0)).toBe("0:00");
    expect(formatTimer(45)).toBe("0:45");
    expect(formatTimer(60 * 3 + 5)).toBe("3:05");
    expect(formatTimer(60 * 60 + 60 * 4 + 2)).toBe("1:04:02");
    expect(formatTimer(-5)).toBe("0:00");
  });
});
