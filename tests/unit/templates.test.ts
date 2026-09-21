import { describe, expect, it } from "vitest";
import {
  DEFAULT_TEMPLATES,
  escapeHtml,
  renderTemplate,
  textToHtmlEmail,
  type TemplateVars,
} from "@/lib/templates";

const vars: TemplateVars = {
  client_name: "Acme",
  invoice_number: "104",
  amount: "850.00",
  due_date: "2026-09-20",
  pay_link: "https://pay.example/104",
  sender_name: "Sam",
  business_name: "Sam Studio",
  final_due_date: "2026-10-11",
};

describe("renderTemplate", () => {
  it("replaces known vars", () => {
    expect(renderTemplate("Hi {{client_name}} #{{invoice_number}}", vars)).toBe(
      "Hi Acme #104",
    );
  });
  it("leaves unknown vars in place (never crashes)", () => {
    expect(renderTemplate("Hi {{nope}}", vars)).toBe("Hi {{nope}}");
  });
  it("all three defaults render with no leftover known vars", () => {
    for (const t of DEFAULT_TEMPLATES) {
      const s = renderTemplate(t.subject, vars);
      const b = renderTemplate(t.body, vars);
      expect(s).not.toMatch(/\{\{(client_name|invoice_number|amount|due_date|pay_link|sender_name|business_name|final_due_date)\}\}/);
      expect(b).not.toMatch(/\{\{(client_name|invoice_number|amount|due_date|pay_link|sender_name|business_name|final_due_date)\}\}/);
    }
  });
});

describe("escapeHtml", () => {
  it("escapes tag chars", () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });
});

describe("textToHtmlEmail", () => {
  it("embeds subject, CTA, and fallback link; escapes input", () => {
    const html = textToHtmlEmail(
      "Hi <b>",
      "Pay <here>:\nhttps://pay.example/104",
      "https://pay.example/104",
    );
    expect(html).toContain("Hi &lt;b&gt;");
    expect(html).toContain("Pay now");
    expect(html).toContain("https://pay.example/104");
    expect(html).not.toContain("<script>");
  });
});
