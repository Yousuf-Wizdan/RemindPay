import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { templateSchema, findUnknownVars } from "@/lib/validation";

export async function PUT(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const unknown = [
    ...findUnknownVars(parsed.data.subject),
    ...findUnknownVars(parsed.data.body),
  ];
  if (unknown.length > 0) {
    return NextResponse.json(
      { error: `Unknown variable(s): ${[...new Set(unknown)].join(", ")}` },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("email_templates")
    .upsert(
      {
        user_id: user.id,
        stage: parsed.data.stage,
        subject: parsed.data.subject.trim(),
        body: parsed.data.body.trim(),
      },
      { onConflict: "user_id,stage" },
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Could not save." }, { status: 500 });
  return NextResponse.json({ template: data });
}
