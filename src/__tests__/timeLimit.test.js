import {
  getTimeLimit,
  setTimeLimit,
  getUsedToday,
  addWatchedMinutes,
  isOverBudget,
  resetToday,
} from "../utils/timeLimit";

describe("timeLimit", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("defaults to 0 (off)", () => {
    expect(getTimeLimit()).toBe(0);
    expect(isOverBudget()).toBe(false);
  });

  test("setTimeLimit clamps to 0..720", () => {
    expect(setTimeLimit(60)).toBe(60);
    expect(getTimeLimit()).toBe(60);
    expect(setTimeLimit(99999)).toBe(720);
    expect(getTimeLimit()).toBe(720);
    expect(setTimeLimit(-5)).toBe(0);
    expect(getTimeLimit()).toBe(0);
  });

  test("addWatchedMinutes accumulates and triggers isOverBudget", () => {
    setTimeLimit(10);
    addWatchedMinutes(4);
    addWatchedMinutes(4);
    expect(getUsedToday()).toBe(8);
    expect(isOverBudget()).toBe(false);
    addWatchedMinutes(4);
    expect(isOverBudget()).toBe(true);
  });

  test("resetToday zeros usage", () => {
    setTimeLimit(20);
    addWatchedMinutes(15);
    resetToday();
    expect(getUsedToday()).toBe(0);
  });

  test("addWatchedMinutes is a no-op for non-positive values", () => {
    setTimeLimit(20);
    addWatchedMinutes(0);
    addWatchedMinutes(-3);
    expect(getUsedToday()).toBe(0);
  });
});
