import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

const ACTIVE = new Set(["active", "authenticated", "created"]);

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = rateLimit(`rzp-webhook:${ip}`, 60, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const evt = JSON.parse(raw) as {
    event: string;
    payload?: {
      subscription?: { entity?: { id?: string; status?: string; current_end?: number; customer_id?: string } };
      payment?: { entity?: { subscription_id?: string } };
    };
  };

  const db = serviceClient();
  console.log(`[razorpay-webhook] ${evt.event}`);

  const sub = evt.payload?.subscription?.entity;
  const subId = sub?.id ?? evt.payload?.payment?.entity?.subscription_id ?? null;

  const toStatus = (): string | null => {
    switch (evt.event) {
      case "subscription.authenticated":
      case "subscription.activated":
      case "subscription.charged":
        return "active";
      case "subscription.cancelled":
        return "canceled";
      case "subscription.paused":
        return "past_due";
      case "subscription.completed":
      case "subscription.expired":
        return "canceled";
      case "subscription.pending":
      case "subscription.halted":
        return "past_due";
      default:
        return null;
    }
  };

  const status = toStatus();
  if (subId && status) {
    const update: Record<string, unknown> = { subscription_status: status };
    if (sub?.current_end) {
      update.subscription_current_period_end = new Date(
        sub.current_end * 1000,
      ).toISOString();
    }
    // Idempotent by subscription id: repeated deliveries converge to same row.
    await db
      .from("profiles")
      .update(update)
      .eq("razorpay_subscription_id", subId);
    void ACTIVE; // documented: treated as paid-access via hasActiveSubscription
  }

  return NextResponse.json({ ok: true });
}
