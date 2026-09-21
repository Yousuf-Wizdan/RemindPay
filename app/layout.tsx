import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RemindPay — Stop chasing invoices",
  description:
    "Paste an overdue invoice and pay link. RemindPay sends 3 polite escalating reminders until it's paid.",
  metadataBase: new URL("https://remindpay.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        {children}
      </body>
    </html>
  );
}
