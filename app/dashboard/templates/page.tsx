import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "@/components/templates/template-editor";
import { ALLOWED_TEMPLATE_VARS } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("email_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("stage");

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <h1 className="text-2xl font-bold">Email templates</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Three reminders, escalating. Available variables:{" "}
        <code className="rounded bg-zinc-100 px-1 text-xs">
          {ALLOWED_TEMPLATE_VARS.map((v) => `{{${v}}}`).join(" ")}
        </code>
      </p>
      <div className="mt-6 space-y-4">
        {(data ?? []).map((t) => (
          <TemplateEditor
            key={t.stage}
            stage={t.stage}
            initialSubject={t.subject}
            initialBody={t.body}
          />
        ))}
      </div>
    </div>
  );
}
