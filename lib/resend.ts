import { Resend } from "resend";

let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not configured");
    client = new Resend(key);
  }
  return client;
}

export function getFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL is not configured");
  return from;
}

/** "Business Name via RemindPay <reminders@domain>" when available. */
export function buildFromHeader(
  businessName?: string | null,
  senderName?: string | null,
): string {
  const from = getFromEmail();
  const label = (businessName || senderName || "RemindPay").trim();
  // Strip characters that break RFC address formatting.
  const safe = label.replace(/[<>"\\]/g, "").slice(0, 80) || "RemindPay";
  return `${safe} via RemindPay <${from}>`;
}
