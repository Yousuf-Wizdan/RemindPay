"use client";

import { InvoiceForm } from "./invoice-form";
import type { InvoiceInput } from "@/lib/validation";

export function InvoiceEditForm({
  invoiceId,
  initial,
}: {
  invoiceId: string;
  initial: InvoiceInput;
}) {
  return <InvoiceForm mode="edit" invoiceId={invoiceId} initial={initial} />;
}
