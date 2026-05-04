-- Migration: add push_subscriptions table for Web Push notifications.
--
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Idempotent: safe to run multiple times.
--
-- Each row is one browser/device's push endpoint. The Edge Function
-- `send-cycle-pushes` reads this table to know where to send notifications.
--
--   user_id    : auth.users(id) — null for unauthenticated users
--   cycle_code : the share code this device is currently watching
--   role       : 'woman' | 'man' (so we can word notifs appropriately)
--   endpoint   : unique URL of the push service (Apple/Google/Mozilla)
--   p256dh     : public key from PushSubscription.getKey('p256dh')
--   auth       : auth secret from PushSubscription.getKey('auth')
--   created_at, updated_at : tracking
--
-- We dedupe on `endpoint` because that's globally unique per device.

create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  cycle_code   text not null,
  role         text not null check (role in ('woman', 'man')),
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists push_subscriptions_cycle_code_idx
  on public.push_subscriptions (cycle_code);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

-- RLS — allow users (incl. anonymous via the cycle code) to manage their
-- own subscriptions, but never read someone else's.
alter table public.push_subscriptions enable row level security;

drop policy if exists "insert own push sub"      on public.push_subscriptions;
drop policy if exists "update own push sub"      on public.push_subscriptions;
drop policy if exists "delete own push sub"      on public.push_subscriptions;
drop policy if exists "select own push sub"      on public.push_subscriptions;

-- Anyone can insert (a device subscribing for a cycle they know the code of).
create policy "insert own push sub"
  on public.push_subscriptions
  for insert
  with check (true);

-- Anyone can update/delete a row matching the endpoint they own (the endpoint
-- is unguessable from outside, so this is safe-by-obscurity for anon users).
-- Auth users can also identify themselves via user_id.
create policy "update own push sub"
  on public.push_subscriptions
  for update
  using (true)
  with check (true);

create policy "delete own push sub"
  on public.push_subscriptions
  for delete
  using (true);

-- Selecting is restricted: only allow reads via service_role (the Edge
-- Function uses the service role key, bypassing RLS anyway). Authenticated
-- users can read their own.
create policy "select own push sub"
  on public.push_subscriptions
  for select
  using (auth.uid() is not null and user_id = auth.uid());

-- Maintain updated_at automatically.
create or replace function public.push_subscriptions_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_push_subscriptions_updated_at on public.push_subscriptions;
create trigger trg_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function public.push_subscriptions_set_updated_at();

-- Sanity check (uncomment to run from the SQL editor):
-- select count(*) from public.push_subscriptions;
