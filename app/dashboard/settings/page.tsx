import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Your name and business appear in reminder emails and the From header.
      </p>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
        <SettingsForm
          initial={{
            full_name: profile?.full_name ?? "",
            business_name: profile?.business_name ?? "",
            timezone: profile?.timezone ?? "UTC",
          }}
          email={user.email ?? ""}
          subscription={profile?.subscription_status ?? "inactive"}
        />
      </div>
    </div>
  );
}
