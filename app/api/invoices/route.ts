import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrInitProfile } from "@/lib/profile";
import { hasActiveSubscription } from "@/lib/reminders";
import { invoiceSchema } from "@/lib/validation";
import { initialNextReminderAt } from "@/lib/reminders";

const ACTIVE_LIMIT = 50;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getOrInitProfile(supabase, user.id, user.email);
  if (!hasActiveSubscription(profile?.subscription_status)) {
    return NextResponse.json(
      { error: "Subscription required. Please subscribe to add invoice chases." },
      { status: 402 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = invoiceSchema.safeParse({
    ...body,
    amount: Number(body?.amount),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("status", "paid");
  if ((count ?? 0) >= ACTIVE_LIMIT) {
    return NextResponse.json(
      { error: "Solo plan allows 50 active chases. Mark some paid first." },
      { status: 403 },
    );
  }

  const d = parsed.data;
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      invoice_number: d.invoice_number,
      client_name: d.client_name,
      client_email: d.client_email.toLowerCase(),
      amount: d.amount,
      currency: "USD",
      due_date: d.due_date,
      pay_link: d.pay_link,
      notes: d.notes || null,
      status: "overdue",
      reminder_stage: 0,
      next_reminder_at: initialNextReminderAt(d.due_date),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You already have an invoice with this number." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Could not save invoice." }, { status: 500 });
  }
  return NextResponse.json({ invoice: data }, { status: 201 });
}
