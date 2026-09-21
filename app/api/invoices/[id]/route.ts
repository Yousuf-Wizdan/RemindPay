import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { invoiceSchema } from "@/lib/validation";
import { snoozeUntil } from "@/lib/reminders";

async function owned(supabase: Awaited<ReturnType<typeof createClient>>, id: string, userId: string) {
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await owned(supabase, id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { action } = body as { action?: string };

  if (action === "mark-paid") {
    const { data, error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        next_reminder_at: null,
        snoozed_until: null,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: "Could not update." }, { status: 500 });
    return NextResponse.json({ invoice: data });
  }

  if (action === "snooze") {
    if (existing.status === "paid" || existing.reminder_stage >= 3) {
      return NextResponse.json(
        { error: "Nothing left to snooze on this invoice." },
        { status: 400 },
      );
    }
    const until = snoozeUntil(7);
    const { data, error } = await supabase
      .from("invoices")
      .update({ snoozed_until: until, next_reminder_at: until })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: "Could not update." }, { status: 500 });
    return NextResponse.json({ invoice: data });
  }

  if (action === "reopen") {
    const { data, error } = await supabase
      .from("invoices")
      .update({ status: "overdue", paid_at: null })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: "Could not update." }, { status: 500 });
    return NextResponse.json({ invoice: data });
  }

  // Plain edit
  const parsed = invoiceSchema.safeParse({ ...body, amount: Number(body?.amount) });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const { data, error } = await supabase
    .from("invoices")
    .update({
      invoice_number: d.invoice_number,
      client_name: d.client_name,
      client_email: d.client_email.toLowerCase(),
      amount: d.amount,
      due_date: d.due_date,
      pay_link: d.pay_link,
      notes: d.notes || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You already have an invoice with this number." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
  return NextResponse.json({ invoice: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Could not delete." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
