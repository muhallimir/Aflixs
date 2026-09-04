import React, { useEffect, useState } from "react";
import Nav from "../Nav";
import Footer from "../Footer";
import { setPageMeta } from "../utils/seo";
import {
  PLANS,
  getBilling,
  setPlan,
  cancelPlan,
  resumePlan,
  getInvoices,
  onBillingChanged,
} from "../utils/billing";
import { getGiftBalance, getGiftHistory, applyGiftBalance, onGiftChanged } from "../utils/giftCodes";
import GiftCodeForm from "../GiftCodeForm";
import "./BillingScreen.css";

function BillingScreen() {
  const [billing, setBilling] = useState(() => {
    try {
      return getBilling();
    } catch (e) {
      return { planId: "standard", status: "active" };
    }
  });
  const [gift, setGift] = useState(() => ({
    balance: getGiftBalance(),
    history: getGiftHistory(),
  }));

  useEffect(() => {
    setPageMeta({ title: "Billing", description: "Manage your Aflixs plan and invoices.", path: "/billing" });
    let off = () => {};
    try {
      off = onBillingChanged(setBilling);
    } catch (e) {
      // ignore
    }
    let offGift = () => {};
    try {
      offGift = onGiftChanged((g) => setGift({ balance: g.balance, history: g.history }));
    } catch (e) {
      // ignore
    }
    return () => {
      off();
      offGift();
    };
  }, []);

  const active = PLANS.find((p) => p.id === billing.planId) || PLANS[1];
  const invoices = getInvoices();

  return (
    <div className="billingScreen">
      <Nav />
      <div className="billingScreen__body">
        <h1>Billing</h1>

        <section className="billingScreen__card" aria-label="Current plan">
          <h2>Current plan</h2>
          <div className="billingScreen__planRow">
            <div>
              <strong className="billingScreen__planName">{active.name}</strong>
              <p className="billingScreen__muted">
                {active.price === 0 ? "Free forever" : `$${active.price.toFixed(2)}/month`}
                {billing.status === "cancelled"
                  ? "  |  Cancelled (access until period end)"
                  : billing.renewsAt
                  ? `  |  Renews ${new Date(billing.renewsAt).toLocaleDateString()}`
                  : ""}
              </p>
              <span
                className={`billingScreen__status ${billing.status}`}
                aria-label={`Plan status ${billing.status}`}
              >
                {billing.status}
              </span>
            </div>
            {billing.status === "cancelled" ? (
              <button
                className="billingScreen__primary"
                onClick={() => {
                  try {
                    setBilling(resumePlan());
                  } catch (e) {
                    // ignore
                  }
                }}
              >
                Resume plan
              </button>
            ) : (
              <button
                className="billingScreen__danger"
                disabled={billing.planId === "free"}
                onClick={() => {
                  try {
                    setBilling(cancelPlan());
                  } catch (e) {
                    // ignore
                  }
                }}
              >
                Cancel plan
              </button>
            )}
          </div>
          <div className="billingScreen__plans" role="group" aria-label="Change plan">
            {PLANS.map((p) => (
              <button
                key={p.id}
                className={`billingScreen__plan ${p.id === billing.planId ? "active" : ""}`}
                aria-pressed={p.id === billing.planId}
                onClick={() => {
                  try {
                    setBilling(setPlan(p.id));
                  } catch (e) {
                    // ignore
                  }
                }}
              >
                {p.name} {p.price === 0 ? "(Free)" : `$${p.price.toFixed(2)}`}
              </button>
            ))}
          </div>
          <p className="billingScreen__note">Demo billing: no real charges. Changes apply to this profile only.</p>
        </section>

        <section className="billingScreen__card" aria-label="Invoices">
          <h2>Invoices</h2>
          {invoices.length === 0 ? (
            <p className="billingScreen__muted">No invoices yet.</p>
          ) : (
            <ul className="billingScreen__invoices">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <span>{inv.id}</span>
                  <span>{inv.date}</span>
                  <span>{inv.plan}</span>
                  <span>{inv.amount}</span>
                  <span className="billingScreen__paid">{inv.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="billingScreen__card" aria-label="Gift codes">
          <h2>Gift codes</h2>
          <p className="billingScreen__muted">
            Balance: <strong>${gift.balance.toFixed(2)}</strong> applied to your next plan change.
          </p>
          <GiftCodeForm
            onRedeemed={(r) => {
              setGift({ balance: getGiftBalance(), history: getGiftHistory() });
              // Auto-apply the new balance toward the current plan.
              if (r && r.ok) applyGiftBalance(r.amount);
            }}
          />
          {gift.history.length > 0 && (
            <ul className="billingScreen__invoices" aria-label="Gift history">
              {gift.history.map((h, i) => (
                <li key={`${h.code}-${i}`}>
                  <span>{h.code}</span>
                  <span>{new Date(h.at).toLocaleDateString()}</span>
                  <span>+${h.amount}</span>
                  <span className="billingScreen__paid">redeemed</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}

export default BillingScreen;
