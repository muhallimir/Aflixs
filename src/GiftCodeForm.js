import React, { useState } from "react";
import { isValidCode, redeemGiftCode } from "./utils/giftCodes";
import "./GiftCodeForm.css";

function GiftCodeForm({ onRedeemed }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const norm = code.trim();
    if (!norm) {
      setMsg("Enter a code first.");
      setOk(false);
      return;
    }
    if (!isValidCode(norm)) {
      setMsg("That code isn't valid. Try WELCOME100, STREAM50 or GIFT25.");
      setOk(false);
      return;
    }
    const r = redeemGiftCode(norm);
    setMsg(r.message);
    setOk(Boolean(r.ok));
    if (r.ok) {
      setCode("");
      if (onRedeemed) onRedeemed(r);
    }
  };

  return (
    <form className="giftCodeForm" onSubmit={submit}>
      <label htmlFor="giftCodeInput">Have a gift code?</label>
      <div className="giftCodeForm__row">
        <input
          id="giftCodeInput"
          type="text"
          value={code}
          placeholder="WELCOME100"
          onChange={(e) => setCode(e.target.value)}
          autoCapitalize="characters"
          aria-invalid={Boolean(msg && !ok)}
        />
        <button type="submit">Redeem</button>
      </div>
      {msg && (
        <p className={`giftCodeForm__msg ${ok ? "ok" : "err"}`} role="status">
          {msg}
        </p>
      )}
      <p className="giftCodeForm__hint">Try WELCOME100, STREAM50 or GIFT25.</p>
    </form>
  );
}

export default GiftCodeForm;
