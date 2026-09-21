-- Row Level Security: users only ever touch their own rows.

alter table public.profiles enable row level security;
alter table public.invoices enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_events enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

-- invoices
drop policy if exists invoices_select_own on public.invoices;
create policy invoices_select_own on public.invoices
  for select using (auth.uid() = user_id);
drop policy if exists invoices_insert_own on public.invoices;
create policy invoices_insert_own on public.invoices
  for insert with check (auth.uid() = user_id);
drop policy if exists invoices_update_own on public.invoices;
create policy invoices_update_own on public.invoices
  for update using (auth.uid() = user_id);
drop policy if exists invoices_delete_own on public.invoices;
create policy invoices_delete_own on public.invoices
  for delete using (auth.uid() = user_id);

-- email_templates
drop policy if exists templates_select_own on public.email_templates;
create policy templates_select_own on public.email_templates
  for select using (auth.uid() = user_id);
drop policy if exists templates_insert_own on public.email_templates;
create policy templates_insert_own on public.email_templates
  for insert with check (auth.uid() = user_id);
drop policy if exists templates_update_own on public.email_templates;
create policy templates_update_own on public.email_templates
  for update using (auth.uid() = user_id);
drop policy if exists templates_delete_own on public.email_templates;
create policy templates_delete_own on public.email_templates
  for delete using (auth.uid() = user_id);

-- email_events (read + insert own; updates/deletes blocked for users)
drop policy if exists events_select_own on public.email_events;
create policy events_select_own on public.email_events
  for select using (auth.uid() = user_id);
drop policy if exists events_insert_own on public.email_events;
create policy events_insert_own on public.email_events
  for insert with check (auth.uid() = user_id);
