import { z } from "zod";

export const invoiceSchema = z.object({
  client_name: z.string().trim().min(1, "Client name is required").max(120),
  client_email: z.string().trim().email("Enter a valid client email").max(254),
  invoice_number: z
    .string()
    .trim()
    .min(1, "Invoice number is required")
    .max(60),
  amount: z
    .number({ message: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .max(10_000_000, "Amount looks too large")
    .refine((n) => Math.round(n * 100) / 100 === n, {
      message: "Amount can have at most two decimal places",
    }),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
    .refine((s) => !Number.isNaN(Date.parse(s + "T00:00:00Z")), {
      message: "Enter a valid calendar date",
    }),
  pay_link: z
    .string()
    .trim()
    .url("Payment link must be a valid URL")
    .refine((s) => s.startsWith("https://"), {
      message: "Payment link must start with https://",
    })
    .refine((s) => !/^javascript:/i.test(s), {
      message: "Unsupported link protocol",
    }),
  notes: z.string().trim().max(2000).optional().default(""),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const templateSchema = z.object({
  stage: z.number().int().min(1).max(3),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  body: z.string().trim().min(1, "Body is required").max(5000),
});

export type TemplateInput = z.infer<typeof templateSchema>;

export const ALLOWED_TEMPLATE_VARS = [
  "client_name",
  "invoice_number",
  "amount",
  "due_date",
  "pay_link",
  "sender_name",
  "business_name",
  "final_due_date",
] as const;

export type AllowedTemplateVar = (typeof ALLOWED_TEMPLATE_VARS)[number];

export function findUnknownVars(text: string): string[] {
  const found = new Set<string>();
  const re = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    if (!(ALLOWED_TEMPLATE_VARS as readonly string[]).includes(name)) {
      found.add(name);
    }
  }
  return [...found];
}
