"use client";

import { useEffect } from "react";

import { CHECKOUT_COMPLETE_KEY, CHECKOUT_PENDING_KEY } from "./checkoutHandoff";

export default function CheckoutPopupHandoff() {
  useEffect(() => {
    const pendingAt = Number(localStorage.getItem(CHECKOUT_PENDING_KEY));
    if (!pendingAt || Date.now() - pendingAt > 30 * 60 * 1000) return;
    localStorage.removeItem(CHECKOUT_PENDING_KEY);
    localStorage.setItem(CHECKOUT_COMPLETE_KEY, String(Date.now()));
    window.close();
  }, []);

  return null;
}
