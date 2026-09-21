import { describe, expect, it } from "vitest";
import { findUnknownVars, invoiceSchema, templateSchema } from "@/lib/validation";

describe("invoiceSchema", () => {
  const good = {
    client_name: "Acme",
    client_email: "ap@acme.com",
    invoice_number: "104",
    amount: 850,
    due_date: "2026-09-20",
    pay_link: "https://pay.example/104",
    notes: "",
  };
  it("accepts valid input", () => {
    expect(invoiceSchema.safeParse(good).success).toBe(true);
  });
  it("rejects bad email", () => {
    expect(
      invoiceSchema.safeParse({ ...good, client_email: "nope" }).success,
    ).toBe(false);
  });
  it("rejects zero/negative amount and >2 decimals", () => {
    expect(invoiceSchema.safeParse({ ...good, amount: 0 }).success).toBe(false);
    expect(invoiceSchema.safeParse({ ...good, amount: 10.999 }).success).toBe(false);
  });
  it("rejects non-https and javascript: links", () => {
    expect(
      invoiceSchema.safeParse({ ...good, pay_link: "http://x.com" }).success,
    ).toBe(false);
    expect(
      invoiceSchema.safeParse({ ...good, pay_link: "javascript:alert(1)" }).success,
    ).toBe(false);
  });
  it("rejects bad date", () => {
    expect(
      invoiceSchema.safeParse({ ...good, due_date: "20-09-2026" }).success,
    ).toBe(false);
  });
});

describe("templateSchema + findUnknownVars", () => {
  it("accepts valid template", () => {
    expect(
      templateSchema.safeParse({ stage: 1, subject: "Hi", body: "Hello" }).success,
    ).toBe(true);
  });
  it("rejects empty subject/body and bad stage", () => {
    expect(
      templateSchema.safeParse({ stage: 4, subject: "x", body: "y" }).success,
    ).toBe(false);
  });
  it("detects unknown vars", () => {
    expect(findUnknownVars("Hi {{client_name}} {{late_fee}}")).toEqual(["late_fee"]);
    expect(findUnknownVars("Hi {{amount}}")).toEqual([]);
  });
});
