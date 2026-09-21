"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay?: any;
  }
}

export function SubscribeButton({ email }: { email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/subscribe", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not start checkout.");
        return;
      }
      if (!window.Razorpay) {
        setError("Checkout script not loaded. Refresh and try again.");
        return;
      }
      const rzp = new window.Razorpay({
        key: json.keyId,
        subscription_id: json.subscriptionId,
        name: "RemindPay",
        description: "Solo plan — $29/month",
        prefill: { email },
        theme: { color: "#18181b" },
        handler: () => {
          router.push("/dashboard?subscribed=1");
        },
      });
      rzp.on("payment.failed", () => {
        setError("Payment failed. Try again or use a different method.");
      });
      rzp.open();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        onClick={start}
        disabled={loading}
        className="w-full rounded-xl bg-zinc-900 px-6 py-3 font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {loading ? "Opening checkout…" : "Subscribe — $29/mo"}
      </button>
    </>
  );
}
