# Push notifications setup

End-to-end setup for "notifications when the app is closed". Do this once.

## 1. Generate VAPID keys

VAPID is the protocol that authenticates your server to the browser's push
service (Apple, Google, Mozilla). You need a public/private key pair.

```sh
npx web-push generate-vapid-keys
```

Output looks like:
```
=======================================
Public Key:
BL...long-base64url...
Private Key:
xY...long-base64url...
=======================================
```

Keep the private key secret. The public key is fine to embed in the client.

## 2. Add the public key to Vercel env

```
VITE_VAPID_PUBLIC_KEY = <Public Key from step 1>
```

Add it via Vercel dashboard → project → Settings → Environment Variables
(scope: Production + Preview + Development), then trigger a redeploy:

```sh
cd ~/Desktop/Cycle-Tracker && npx vercel --prod
```

Verify in the deployed app's `index-*.js` that the key is bundled (it
should be — Vite inlines `VITE_*` env vars at build time).

## 3. Add the Supabase secrets

The Edge Function needs all three:

```sh
supabase secrets set \
  VAPID_PUBLIC_KEY=<Public Key> \
  VAPID_PRIVATE_KEY=<Private Key> \
  VAPID_SUBJECT=mailto:tom38miami@gmail.com
```

(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by
Supabase — you don't need to set them.)

## 4. Run the migrations on Supabase

In the Supabase SQL editor, paste and run **in order**:

1. `migrations/2026-05-03_add_push_subscriptions.sql`
   — creates the `push_subscriptions` table + RLS.

2. `migrations/2026-05-03_setup_push_cron.sql`
   — schedules the daily function call.
   ⚠ Before running, replace the two placeholders:
   - `<PROJECT_REF>` → your Supabase project ref (the subdomain, e.g.
     `hitzunvefbgtfxivectd`).
   - `<SERVICE_ROLE_KEY>` → from Supabase dashboard → Settings → API
     → `service_role` key.

## 5. Deploy the Edge Function

From the project root:

```sh
supabase functions deploy send-cycle-pushes --no-verify-jwt
```

If you don't have the Supabase CLI:
```sh
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <PROJECT_REF>
```

The `--no-verify-jwt` is important: the cron job calls the function
with a Bearer token but pg_cron's net.http_post doesn't carry JWT
verification, so we disable verification and rely on the unguessable
subscription endpoint as the security boundary.

## 6. Smoke test

Once everything is deployed:

```sh
curl -X POST 'https://<PROJECT_REF>.functions.supabase.co/send-cycle-pushes' \
  -H 'Authorization: Bearer <SERVICE_ROLE_KEY>'
```

Expected JSON:
```json
{ "ok": true, "sent": <int>, "failed": 0, "cleaned": 0 }
```

If `sent === 0` and `reason === "no-subscriptions"`, that means no device
has subscribed yet. Open the app on your phone, enable notifications via
the bell prompt, and try again.

## 7. Cron schedule

By default the function runs daily at 09:00 UTC (= 11:00 Paris CEST).
To change, edit the `cron.schedule(...)` call in the migration. Any
standard cron expression works.

To inspect / unschedule:
```sql
select jobname, schedule, command from cron.job;
select cron.unschedule('cycle-tracker-daily-push');
```

## How it all wires up

```
[Phone] —register sw.js—►  [Browser SW]
       —subscribe to push, get endpoint—► [Supabase: push_subscriptions]

[Cron 09:00 UTC] ──► [Edge Function send-cycle-pushes]
                       │
                       │ reads cycles + subscriptions
                       │ runs computeNotifications() per (cycle, role)
                       │ POSTs each notif via web-push (VAPID-signed)
                       │
                       ▼
                     [Push service: Apple/Google/Mozilla]
                       │
                       ▼
                     [Phone SW receives 'push' event]
                     [shows OS notification — even if app is closed]
```

## Common issues

- **iOS: notifications never arrive** → on iOS, Web Push only works in
  apps that have been **added to the Home Screen** (PWA install prompt).
  Tell the user to tap Share → Add to Home Screen, then re-enable
  notifications from inside the standalone PWA.
- **`reason: "no-vapid-key"` returned by subscribeToPush** → the
  `VITE_VAPID_PUBLIC_KEY` wasn't bundled at build time. Redeploy via
  `npx vercel --prod` after setting the env var.
- **`401 Unauthorized` from Edge Function** → the cron migration uses
  the wrong service-role key, or the function was deployed without
  `--no-verify-jwt`.
- **Subscriptions accumulate but nothing is sent** → confirm the cron
  is firing: `select * from cron.job_run_details order by start_time desc;`.
