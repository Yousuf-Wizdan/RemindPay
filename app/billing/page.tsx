import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { hasActiveSubscription } from "@/lib/reminders";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status,subscription_current_period_end")
    .eq("id", user.id)
    .single();

  const active = hasActiveSubscription(profile?.subscription_status);

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-5 py-10">
      <h1 className="text-2xl font-bold">Billing</h1>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="font-semibold">Solo plan — $29/month</p>
        <ul className="mt-3 space-y-1.5 text-sm text-zinc-600">
          <li>✓ 50 active invoice chases</li>
          <li>✓ 1 sender identity</li>
          <li>✓ 3 automated reminders</li>
          <li>✓ Editable templates</li>
        </ul>
        <p className="mt-4 text-sm">
          Status:{" "}
          <span className="font-semibold">
            {profile?.subscription_status ?? "inactive"}
          </span>
          {profile?.subscription_current_period_end && (
            <span className="text-zinc-500">
              {" "}
              · renews {new Date(profile.subscription_current_period_end).toLocaleDateString()}
            </span>
          )}
        </p>
        <div className="mt-5">
          {active ? (
            <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
              Your subscription is active. Manage or cancel it from your
              Razorpay receipt emails or contact support.
            </p>
          ) : (
            <SubscribeButton email={user.email ?? ""} />
          )}
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Payments process securely via Razorpay. Cancel anytime — your
          invoices stay visible and automated sends pause.
        </p>
      </div>
    </div>
  );
}
