export interface TemplateVars {
  client_name: string;
  invoice_number: string;
  amount: string;
  due_date: string;
  pay_link: string;
  sender_name: string;
  business_name: string;
  final_due_date: string;
}

export const DEFAULT_TEMPLATES: { stage: number; subject: string; body: string }[] = [
  {
    stage: 1,
    subject: "Quick reminder: Invoice #{{invoice_number}} for ${{amount}} is open",
    body: [
      "Hi {{client_name}} — hope well. Just a quick nudge that invoice #{{invoice_number}} for ${{amount}} due {{due_date}} is still open.",
      "",
      "Pay here: {{pay_link}}",
      "",
      "Let me know if you need anything from me.",
      "",
      "Thanks,",
      "{{sender_name}}",
    ].join("\n"),
  },
  {
    stage: 2,
    subject: "Following up: Invoice #{{invoice_number}}",
    body: [
      "Hi {{client_name}} — following up on invoice #{{invoice_number}} (${{amount}}). Still showing open.",
      "",
      "If there's an issue with payment let me know, otherwise you can close it here:",
      "",
      "{{pay_link}}",
      "",
      "Appreciate it,",
      "{{sender_name}}",
    ].join("\n"),
  },
  {
    stage: 3,
    subject: "Final notice: Invoice #{{invoice_number}} overdue",
    body: [
      "Hi {{client_name}} — this is the final auto-reminder for invoice #{{invoice_number}} (${{amount}}, due {{due_date}}).",
      "",
      "Please pay by {{final_due_date}} to avoid late fee / pause:",
      "",
      "{{pay_link}}",
      "",
      "Reply to this email if you need help.",
      "",
      "Thanks,",
      "{{sender_name}}",
    ].join("\n"),
  },
];

/** Safe interpolation: unknown {{vars}} are left in place, never executed. */
export function renderTemplate(text: string, vars: TemplateVars): string {
  return text.replace(
    /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
    (match, name: string) => {
      if (name in vars) {
        return vars[name as keyof TemplateVars] ?? match;
      }
      return match;
    },
  );
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain text body -> simple safe HTML email with payment CTA. */
export function textToHtmlEmail(
  subject: string,
  bodyText: string,
  payLink: string,
): string {
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px 0;line-height:1.6;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
  const safeSubject = escapeHtml(subject);
  const safePayLink = escapeHtml(payLink);
  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
<div style="max-width:560px;margin:0 auto;padding:24px 16px;">
<div style="background:#ffffff;border:1px solid #e6e8ec;border-radius:12px;padding:28px;">
<p style="margin:0 0 6px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;">RemindPay</p>
<h1 style="margin:0 0 18px 0;font-size:19px;line-height:1.4;">${safeSubject}</h1>
${paragraphs}
<div style="margin:22px 0;">
<a href="${safePayLink}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px;font-weight:600;">Pay now</a>
</div>
<p style="margin:18px 0 0 0;font-size:13px;color:#6b7280;">Trouble with the button? Paste this link:<br/><a href="${safePayLink}" style="color:#2563eb;word-break:break-all;">${safePayLink}</a></p>
</div>
<p style="margin:16px 0 0 0;font-size:12px;color:#9ca3af;text-align:center;">Sent via RemindPay · remindpay.com</p>
</div>
</body></html>`;
}
