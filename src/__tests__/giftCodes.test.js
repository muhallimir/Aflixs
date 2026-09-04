import { isValidCode, redeemGiftCode, getGiftBalance, applyGiftBalance, getGiftHistory } from "../utils/giftCodes";

describe("giftCodes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("isValidCode accepts the demo codes case-insensitively", () => {
    expect(isValidCode("welcome100")).toBe(100);
    expect(isValidCode("STREAM50")).toBe(50);
    expect(isValidCode("Gift25")).toBe(25);
  });

  test("isValidCode rejects unknown / empty", () => {
    expect(isValidCode("")).toBeNull();
    expect(isValidCode("not-a-code")).toBeNull();
    expect(isValidCode(null)).toBeNull();
  });

  test("redeemGiftCode adds to balance and writes history", () => {
    const r1 = redeemGiftCode("WELCOME100");
    expect(r1.ok).toBe(true);
    expect(getGiftBalance()).toBe(100);
    const r2 = redeemGiftCode("STREAM50");
    expect(r2.ok).toBe(true);
    expect(getGiftBalance()).toBe(150);
    expect(getGiftHistory().length).toBe(2);
  });

  test("applyGiftBalance subtracts from balance", () => {
    redeemGiftCode("WELCOME100");
    applyGiftBalance(40);
    expect(getGiftBalance()).toBe(60);
    applyGiftBalance(9999);
    expect(getGiftBalance()).toBe(0);
  });
});
