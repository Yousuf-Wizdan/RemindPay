# RemindPay

> Paste an overdue invoice, we politely chase it for you until it's paid.

SaaS invoice follow-up automation for US/EU freelancers and small agencies. $29/mo Solo plan via Razorpay. Live at **remindpay.com**.

## Stack (all free-tier to start)

- Next.js 16 App Router + TypeScript + Tailwind CSS 4
- Supabase Auth (cookie SSR via `@supabase/ssr`) + Postgres + RLS
- Razorpay Subscriptions ($29/mo Solo plan) + webhooks
- Resend email API + delivery webhooks
- Vercel Cron (daily `0 8 * * *`) + Zod + Vitest + Playwright

## Setup

1. **Supabase project** (free tier):
   - Create project at supabase.com → copy URL + publishable key + service-role key.
   - Apply migrations: `supabase/migrations/*.sql` via Supabase Dashboard → SQL Editor (init, then rls), or `supabase db push`.
   - Auth → enable Email provider. Add redirect `http(s)://YOUR_DOMAIN/auth/confirm`.
2. **Razorpay test mode**: Dashboard → create Product + monthly **$29** Plan → copy `RAZORPAY_PLAN_ID`.
   - Webhooks → add `https://YOUR_DOMAIN/api/webhooks/razorpay` → copy `RAZORPAY_WEBHOOK_SECRET`.
   - Subscribe to: `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.paused`, `subscription.pending`, `subscription.halted`, `subscription.completed`, `subscription.expired`.
   - Copy Key Id (`NEXT_PUBLIC_RAZORPAY_KEY_ID`) + Key Secret (`RAZORPAY_KEY_SECRET`).
3. **Resend**: verify a sending domain (e.g. `remindpay.com`) → create API key → set `RESEND_API_KEY` + `RESEND_FROM_EMAIL=reminders@remindpay.com`.
   - Webhooks → `https://YOUR_DOMAIN/api/webhooks/resend` (delivered/opened/clicked/bounced/complained). Events are bound to our stored `resend_email_id`, so unknown ids are ignored.
4. **Env**: `cp .env.example .env.local` and fill values. Never commit `.env.local`.
5. **Install + run**:
   ```bash
   npm install
   npm run dev        # http://localhost:3000
   npm run typecheck && npm run lint && npm test && npm run build
   ```
6. **Vercel deploy**: import repo → set env vars → `vercel.json` already schedules daily cron. Set Vercel Cron secret = `CRON_SECRET` (route requires `Authorization: Bearer <CRON_SECRET>`).
7. **Local webhook testing**: use `ngrok http 3000` pointing provider webhooks at the tunnel URL.

## How it works

- User adds overdue invoice → `next_reminder_at = due date (UTC)`.
- Daily cron `GET /api/cron/process-reminders` (Bearer `CRON_SECRET`) sends stage 1 (Day 0), 2 (due+7), 3 (due+14) via Resend, `reply_to = user email`. Paid/snoozed/complete/inactive-subscription invoices are skipped. Sends are idempotent (sent-event check before each send; failed sends don't advance stage).
- Snooze sets `next_reminder_at = now + 7d` without resetting stage; never adds a 4th send. Mark Paid clears schedule; cron ignores paid.
- Billing: browser opens Razorpay Checkout with server-created `subscription_id`; webhook is source of truth for `profiles.subscription_status`. Inactive users see data but automated sends are blocked.

## Routes

- `/` landing, `/pricing`, `/login`, `/signup`, `/forgot-password`, `/auth/confirm`
- `/dashboard`, `/dashboard/invoices/new`, `/dashboard/invoices/[id]`, `/dashboard/templates`, `/dashboard/settings`, `/billing`
- `POST /api/invoices`, `PATCH/DELETE /api/invoices/[id]`, `PUT /api/templates`, `PUT /api/profile`
- `POST /api/billing/subscribe`, `POST /api/webhooks/razorpay`, `POST /api/webhooks/resend`, `GET /api/cron/process-reminders`

## Tests

- `npm test` — 37 unit tests (reminder engine, templates, validation, billing sigs).
- `npm run test:e2e` — critical-path spec scaffold (run against staging with seeded auth).
