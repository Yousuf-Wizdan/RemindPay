import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvoiceForm } from "@/components/invoices/invoice-form";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <h1 className="text-2xl font-bold">Add overdue invoice</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Takes 60 seconds. The first reminder is scheduled for the due date.
      </p>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
        <InvoiceForm mode="create" />
      </div>
    </div>
  );
}
