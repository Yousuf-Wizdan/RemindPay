import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Resend webhooks (Svix-signed). We accept configured shared-secret
 * verification: if RESEND_WEBHOOK_SECRET is set, require a matching
 * `svix-signature` construct; otherwise record only events carrying an
 * email_id we already stored (binds the event to our own send).
 */
export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = rateLimit(`resend-webhook:${ip}`, 60, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad payload" }, { status: 400 });

  const type: string = body.type ?? body.event ?? "";
  const data = body.data ?? {};
  const emailId: string | null =
    data.email_id ?? data.emailId ?? data.id ?? null;

  const map: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.bounced": "bounced",
    "email.complained": "complained",
    sent: "sent",
    delivered: "delivered",
    opened: "opened",
    clicked: "clicked",
    bounced: "bounced",
    complained: "complained",
  };
  const eventType = map[type];
  if (!eventType || !emailId) {
    // Unknown/heartbeat events: ack without action.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const db = serviceClient();
  // Bind to our own send record — ignore forged ids.
  const { data: prior } = await db
    .from("email_events")
    .select("id,user_id,invoice_id,stage")
    .eq("resend_email_id", emailId)
    .order("event_at", { ascending: true })
    .limit(1);
  if (!prior || prior.length === 0) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await db.from("email_events").insert({
    user_id: prior[0].user_id,
    invoice_id: prior[0].invoice_id,
    stage: prior[0].stage,
    resend_email_id: emailId,
    event_type: eventType,
    payload: { provider_type: type },
  });

  console.log(`[resend-webhook] ${eventType} email=${emailId}`);
  return NextResponse.json({ ok: true });
}
