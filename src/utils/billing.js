// Mock billing state (per-profile localStorage, no real charges).
// Emits "aflixs:billing-changed" on changes.

import { ns } from "./profiles";

export const PLANS = [
  { id: "free", name: "Free", price: 0 },
  { id: "standard", name: "Standard", price: 9.99 },
  { id: "premium", name: "Premium", price: 14.99 },
];

function key() {
  try {
    return ns("billing");
  } catch (e) {
    return "aflixs_main_billing";
  }
}

function readState() {
  try {
    const raw = localStorage.getItem(key());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.planId) return { status: "active", ...parsed };
    }
  } catch (e) {
    // fall through
  }
  return { planId: "standard", status: "active", renewsAt: nextRenewal() };
}

function nextRenewal() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

function writeState(state) {
  try {
    localStorage.setItem(key(), JSON.stringify(state));
  } catch (e) {
    // ignore
  }
  try {
    window.dispatchEvent(new CustomEvent("aflixs:billing-changed", { detail: state }));
  } catch (e) {
    // ignore
  }
}

export function getBilling() {
  return readState();
}

export function setPlan(planId) {
  const next = { ...readState(), planId, status: "active", renewsAt: nextRenewal() };
  writeState(next);
  return next;
}

export function cancelPlan() {
  const next = { ...readState(), status: "cancelled" };
  writeState(next);
  return next;
}

export function resumePlan() {
  const next = { ...readState(), status: "active", renewsAt: nextRenewal() };
  writeState(next);
  return next;
}

// Deterministic mock invoices derived from the plan price.
export function getInvoices() {
  const { planId } = readState();
  const plan = PLANS.find((p) => p.id === planId) || PLANS[1];
  return [0, 1, 2].map((i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      id: `INV-2024-${String(1200 - i * 7).padStart(4, "0")}`,
      date: d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }),
      plan: plan.name,
      amount: plan.price === 0 ? "Free" : `$${plan.price.toFixed(2)}`,
      status: i === 0 ? "Paid" : "Paid",
    };
  });
}

export function onBillingChanged(cb) {
  const handler = (e) => cb(e.detail || readState());
  window.addEventListener("aflixs:billing-changed", handler);
  window.addEventListener("aflixs:profile-switched", () => cb(readState()));
  return () => {
    window.removeEventListener("aflixs:billing-changed", handler);
  };
}
