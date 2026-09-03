// Tests for the skip intro / recap pure logic.

import {
  SKIP_INTRO_SECONDS,
  SKIP_RECAP_SECONDS,
  computeSkipTargets,
  formatSkip,
} from "../utils/skipControls";

describe("skipControls utils", () => {
  test("default constants are sane", () => {
    expect(SKIP_INTRO_SECONDS).toBe(90);
    expect(SKIP_RECAP_SECONDS).toBe(30);
  });

  test("computeSkipTargets returns both buttons enabled for unknown runtime", () => {
    const out = computeSkipTargets(0);
    expect(out.hasIntro).toBe(true);
    expect(out.hasRecap).toBe(true);
    expect(out.intro).toBe(SKIP_INTRO_SECONDS);
    expect(out.recap).toBe(SKIP_RECAP_SECONDS);
  });

  test("hides recap on short titles (under 22 minutes)", () => {
    const out = computeSkipTargets(20);
    expect(out.hasIntro).toBe(true);
    expect(out.hasRecap).toBe(false);
  });

  test("hides both for very short titles (under 12 minutes)", () => {
    const out = computeSkipTargets(10);
    expect(out.hasIntro).toBe(false);
    expect(out.hasRecap).toBe(false);
  });

  test("scales durations for very long titles but never exceeds defaults", () => {
    const out = computeSkipTargets(200);
    expect(out.hasIntro).toBe(true);
    expect(out.hasRecap).toBe(true);
    expect(out.intro).toBeLessThanOrEqual(SKIP_INTRO_SECONDS);
    expect(out.recap).toBeLessThanOrEqual(SKIP_RECAP_SECONDS);
  });

  test("formatSkip renders mm:ss with two digits", () => {
    expect(formatSkip(0)).toBe("0:00");
    expect(formatSkip(45)).toBe("0:45");
    expect(formatSkip(90)).toBe("1:30");
    expect(formatSkip(60 * 12 + 5)).toBe("12:05");
    expect(formatSkip(-1)).toBe("0:00");
  });
});
