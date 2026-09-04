// Gift code redemption (mock). Stores a balance per profile; codes are case-
// insensitive alphanumeric. We define a small set of valid codes for the demo
// and otherwise reject the input. The redeemed balance is added to the user's
// gift balance and reflected via the billing screen.

import { ns } from "./profiles";

const KEY_GIFT = "gift_balance";
const KEY_HISTORY = "gift_history";

const VALID_CODES = {
  WELCOME100: 100,
  STREAM50: 50,
  GIFT25: 25,
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore quota
  }
}

function balanceKey() {
  try {
    return ns(KEY_GIFT);
  } catch (e) {
    return "aflixs_main_gift_balance";
  }
}

function historyKey() {
  try {
    return ns(KEY_HISTORY);
  } catch (e) {
    return "aflixs_main_gift_history";
  }
}

export function getGiftBalance() {
  return Math.max(0, Math.round(Number(readJSON(balanceKey(), 0)) || 0));
}

export function getGiftHistory() {
  const raw = readJSON(historyKey(), []);
  return Array.isArray(raw) ? raw : [];
}

export function applyGiftBalance(usd) {
  const cur = getGiftBalance();
  const next = Math.max(0, cur - Math.abs(Number(usd) || 0));
  writeJSON(balanceKey(), next);
  try {
    window.dispatchEvent(new CustomEvent("aflixs:gift-changed"));
  } catch (e) {
    // ignore
  }
  return next;
}

export function isValidCode(code) {
  if (!code) return null;
  const norm = String(code).trim().toUpperCase();
  return VALID_CODES[norm] || null;
}

export function redeemGiftCode(code) {
  const amount = isValidCode(code);
  if (!amount) {
    return { ok: false, message: "Invalid or unknown gift code." };
  }
  const next = getGiftBalance() + amount;
  writeJSON(balanceKey(), next);
  const history = getGiftHistory();
  history.unshift({ code: String(code).trim().toUpperCase(), amount, at: Date.now() });
  writeJSON(historyKey(), history.slice(0, 50));
  try {
    window.dispatchEvent(new CustomEvent("aflixs:gift-changed"));
  } catch (e) {
    // ignore
  }
  return { ok: true, message: `Added $${amount} to your gift balance.`, amount };
}

export function onGiftChanged(cb) {
  const handler = () => {
    try {
      cb({ balance: getGiftBalance(), history: getGiftHistory() });
    } catch (e) {
      // ignore
    }
  };
  window.addEventListener("aflixs:gift-changed", handler);
  window.addEventListener("aflixs:profile-switched", handler);
  return () => {
    window.removeEventListener("aflixs:gift-changed", handler);
    window.removeEventListener("aflixs:profile-switched", handler);
  };
}
