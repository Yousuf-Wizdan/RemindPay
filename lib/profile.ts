import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TEMPLATES } from "@/lib/templates";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  business_name: string | null;
  timezone: string;
  subscription_status: string;
}

/** Load profile, creating it + seeding templates if missing (idempotent). */
export async function getOrInitProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email?: string | null,
) {
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) {
    const { data } = await supabase
      .from("profiles")
      .insert({ id: userId, email: email ?? null })
      .select()
      .single();
    profile = data;
  }

  if (profile) {
    const { data: existing } = await supabase
      .from("email_templates")
      .select("stage")
      .eq("user_id", userId);
    const have = new Set((existing ?? []).map((t) => t.stage));
    const missing = DEFAULT_TEMPLATES.filter((t) => !have.has(t.stage));
    if (missing.length > 0) {
      await supabase.from("email_templates").upsert(
        missing.map((t) => ({
          user_id: userId,
          stage: t.stage,
          subject: t.subject,
          body: t.body,
        })),
        { onConflict: "user_id,stage", ignoreDuplicates: true },
      );
    }
  }

  return profile as Profile | null;
}
