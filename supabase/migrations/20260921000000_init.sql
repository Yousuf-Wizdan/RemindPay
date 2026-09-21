-- RemindPay initial schema: profiles, invoices, email_templates, email_events
-- Run with: supabase db push (see README)

-- profiles ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  business_name text,
  timezone text not null default 'UTC',
  razorpay_customer_id text unique,
  razorpay_subscription_id text unique,
  subscription_status text not null default 'inactive'
    check (subscription_status in ('inactive','trialing','active','past_due','canceled','incomplete')),
  subscription_current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- invoices ---------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  client_name text not null,
  client_email text not null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD' check (currency = 'USD'),
  due_date date not null,
  pay_link text not null,
  status text not null default 'overdue'
    check (status in ('overdue','nudging','paid')),
  notes text,
  reminder_stage integer not null default 0
    check (reminder_stage between 0 and 3),
  next_reminder_at timestamptz,
  last_sent_at timestamptz,
  paid_at timestamptz,
  snoozed_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, invoice_number)
);

create index if not exists invoices_user_status_idx
  on public.invoices (user_id, status);
create index if not exists invoices_next_reminder_idx
  on public.invoices (next_reminder_at)
  where status <> 'paid';

-- email_templates --------------------------------------------------------
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stage integer not null check (stage between 1 and 3),
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, stage)
);

-- email_events ------------------------------------------------------------
create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  stage integer not null check (stage between 1 and 3),
  resend_email_id text,
  event_type text not null
    check (event_type in ('queued','sent','delivered','opened','clicked','bounced','complained','failed')),
  event_at timestamptz not null default now(),
  payload jsonb,
  created_at timestamptz not null default now(),
  unique (invoice_id, stage, event_type, resend_email_id)
);

create index if not exists email_events_invoice_idx
  on public.email_events (invoice_id, event_at desc);

-- updated_at trigger ------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists invoices_touch on public.invoices;
create trigger invoices_touch before update on public.invoices
  for each row execute function public.touch_updated_at();
drop trigger if exists templates_touch on public.email_templates;
create trigger templates_touch before update on public.email_templates
  for each row execute function public.touch_updated_at();

-- auto-create profile on signup -------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
