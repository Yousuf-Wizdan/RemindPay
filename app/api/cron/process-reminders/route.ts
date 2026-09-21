import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_TEMPLATES, renderTemplate, textToHtmlEmail } from "@/lib/templates";
import {
  formatAmount,
  hasActiveSubscription,
  isEligibleForSend,
  nextReminderAfterStage,
} from "@/lib/reminders";
import { buildFromHeader, getFromEmail, getResend } from "@/lib/resend";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

function finalDueDate(dueISO: string): string {
  return new Date(new Date(dueISO + "T00:00:00Z").getTime() + 21 * 86400_000)
    .toISOString()
    .slice(0, 10);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const stats = { eligible: 0, sent: 0, skipped: 0, failed: 0, errors: [] as string[] };

  let db;
  try {
    db = serviceClient();
  } catch (e) {
    console.error("[cron] service client init failed", (e as Error).message);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const now = new Date();
  const { data: invoices, error } = await db
    .from("invoices")
    .select("*")
    .neq("status", "paid")
    .lt("next_reminder_at", now.toISOString())
    .order("next_reminder_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("[cron] query failed", error.message);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  console.log(`[cron] start: ${invoices?.length ?? 0} candidate invoices`);

  for (const inv of invoices ?? []) {
    const check = isEligibleForSend(inv, now);
    if (!check.eligible || !check.stage) {
      stats.skipped += 1;
      continue;
    }
    stats.eligible += 1;
    const stage = check.stage;

    // Subscription gate per user.
    const { data: profile } = await db
      .from("profiles")
      .select("subscription_status,email,full_name,business_name")
      .eq("id", inv.user_id)
      .single();
    if (!hasActiveSubscription(profile?.subscription_status)) {
      stats.skipped += 1;
      continue;
    }

    // Idempotency: skip if this stage already has a sent event.
    const { data: dup } = await db
      .from("email_events")
      .select("id")
      .eq("invoice_id", inv.id)
      .eq("stage", stage)
      .in("event_type", ["queued", "sent", "delivered"])
      .limit(1);
    if (dup && dup.length > 0) {
      // Advance past a stage that was already sent (e.g. duplicate run).
      await db
        .from("invoices")
        .update({
          reminder_stage: stage,
          last_sent_at: now.toISOString(),
          status: "nudging",
          next_reminder_at: nextReminderAfterStage(inv.due_date, stage),
        })
        .eq("id", inv.id);
      stats.skipped += 1;
      continue;
    }

    // Resolve template (user's own, else default).
    let subject = "";
    let body = "";
    const { data: tpl } = await db
      .from("email_templates")
      .select("subject,body")
      .eq("user_id", inv.user_id)
      .eq("stage", stage)
      .single();
    if (tpl) {
      subject = tpl.subject;
      body = tpl.body;
    } else {
      const def = DEFAULT_TEMPLATES.find((t) => t.stage === stage)!;
      subject = def.subject;
      body = def.body;
    }

    const senderName =
      profile?.full_name || profile?.business_name || "RemindPay user";
    const vars = {
      client_name: inv.client_name,
      invoice_number: inv.invoice_number,
      amount: formatAmount(inv.amount),
      due_date: inv.due_date,
      pay_link: inv.pay_link,
      sender_name: senderName,
      business_name: profile?.business_name || "",
      final_due_date: finalDueDate(inv.due_date),
    };
    const renderedSubject = renderTemplate(subject, vars);
    const renderedBody = renderTemplate(body, vars);

    try {
      const resend = getResend();
      const { data: sent, error: sendError } = await resend.emails.send({
        from: buildFromHeader(profile?.business_name, profile?.full_name),
        to: inv.client_email,
        replyTo: profile?.email || undefined,
        subject: renderedSubject,
        text: renderedBody,
        html: textToHtmlEmail(renderedSubject, renderedBody, inv.pay_link),
      });
      if (sendError || !sent) {
        throw new Error(sendError?.message ?? "Resend returned no result");
      }

      await db.from("email_events").insert({
        user_id: inv.user_id,
        invoice_id: inv.id,
        stage,
        resend_email_id: sent.id ?? null,
        event_type: "sent",
        payload: { to: inv.client_email, subject: renderedSubject },
      });

      await db
        .from("invoices")
        .update({
          reminder_stage: stage,
          last_sent_at: now.toISOString(),
          status: "nudging",
          next_reminder_at: nextReminderAfterStage(inv.due_date, stage),
          snoozed_until: null,
        })
        .eq("id", inv.id);

      stats.sent += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "send failed";
      console.error(`[cron] send failed invoice=${inv.id} stage=${stage}: ${msg}`);
      stats.failed += 1;
      stats.errors.push(`${inv.id}: ${msg}`);
      await db.from("email_events").insert({
        user_id: inv.user_id,
        invoice_id: inv.id,
        stage,
        event_type: "failed",
        payload: { error: msg.slice(0, 500) },
      });
      // Do NOT advance stage: retry on next run.
    }
  }

  // Bounce/complaint suppression note: future sends check latest events.
  console.log(
    `[cron] end in ${Date.now() - started}ms: eligible=${stats.eligible} sent=${stats.sent} skipped=${stats.skipped} failed=${stats.failed}`,
  );
  void getFromEmail; // keep import used if Resend disabled in some envs
  return NextResponse.json({ ok: true, ...stats, ms: Date.now() - started });
}
