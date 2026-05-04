-- Migration: schedule send-cycle-pushes via pg_cron + pg_net.
--
-- Run AFTER deploying the Edge Function `send-cycle-pushes`.
--
-- This calls the function once a day at 09:00 UTC. Adjust the schedule
-- and SUPABASE_URL placeholder before running.
--
-- ⚠ EDIT THESE BEFORE RUNNING ⚠
--   <PROJECT_REF>          : your Supabase project ref (the subdomain)
--   <SERVICE_ROLE_KEY>     : the service-role key (Settings → API → service_role)
--                            We use it as a Bearer to bypass JWT, since the
--                            function is deployed with --no-verify-jwt.

-- Make sure the extensions are enabled.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;

-- Drop any previous schedule with the same name (idempotent).
select cron.unschedule('cycle-tracker-daily-push')
  where exists (
    select 1 from cron.job where jobname = 'cycle-tracker-daily-push'
  );

-- Schedule once per day at 09:00 UTC.
-- (Cron format: minute hour dom month dow)
select cron.schedule(
  'cycle-tracker-daily-push',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/send-cycle-pushes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Inspect schedules:
-- select jobname, schedule, command from cron.job;
