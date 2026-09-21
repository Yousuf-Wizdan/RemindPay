import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanId, getRazorpay } from "@/lib/razorpay";

/**
 * Creates a Razorpay subscription for the $29 Solo plan and returns the
 * subscription id + public key so the browser can open Razorpay Checkout.
 * Server uses RAZORPAY_PLAN_ID only — never accepts plan ids from the client.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();
  void profile;

  try {
    const rzp = getRazorpay();

    const subscription = await rzp.subscriptions.create({
      plan_id: getPlanId(),
      total_count: 120, // 10 years of monthly billing; cancel anytime
      customer_notify: 1,
      notes: { supabase_user_id: user.id, email: user.email ?? "" },
    });

    await supabase
      .from("profiles")
      .update({ razorpay_subscription_id: subscription.id })
      .eq("id", user.id);

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (e) {
    console.error("[billing] subscription create failed", (e as Error).message);
    return NextResponse.json(
      { error: "Could not start checkout. Try again." },
      { status: 500 },
    );
  }
}
