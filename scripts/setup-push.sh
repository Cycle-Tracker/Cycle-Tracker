#!/usr/bin/env bash
#
# One-shot setup for push notifications.
# Run from the repo root: bash scripts/setup-push.sh
#
# What it does:
#   1. Pushes the current commit to GitHub
#   2. Adds VITE_VAPID_PUBLIC_KEY to Vercel env (Production + Preview + Development)
#   3. Triggers a Vercel production redeploy so the new env is bundled
#   4. Installs the Supabase CLI if missing
#   5. Logs you in to Supabase + links to the project
#   6. Pushes the 3 secrets (VAPID public/private/subject) to Supabase
#   7. Deploys the send-cycle-pushes Edge Function
#
# What it does NOT do (you have to paste these into Supabase SQL editor manually):
#   - migrations/2026-05-03_add_push_subscriptions.sql
#   - migrations/2026-05-03_setup_push_cron.sql  (after replacing <SERVICE_ROLE_KEY>)
#
# Set these before running, or the script will exit:
VAPID_PUBLIC_KEY="BPgoalW_AugJ4RriktIZjVFlPP7O2WT6CylEqJb4BV7u6EorhY0n-JyhZ6v5oGr06Cc6nrZjbcHbcVmPLkoiuPE"
VAPID_PRIVATE_KEY="DLKnUl_OnAi1ZBkrERU4zeSkok8f6HekxyxrJCaQQug"
VAPID_SUBJECT="mailto:tom38miami@gmail.com"
PROJECT_REF="hitzunvefbgtfxivectd"

set -euo pipefail

if [ -z "$VAPID_PUBLIC_KEY" ] || [ -z "$VAPID_PRIVATE_KEY" ]; then
  echo "❌ VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set at the top of this script."
  exit 1
fi

echo ""
echo "▶ Step 1/7: pushing current commit to GitHub"
git push origin main || echo "  (nothing to push)"

echo ""
echo "▶ Step 2/7: adding VITE_VAPID_PUBLIC_KEY to Vercel env"
# Remove pre-existing values to make this idempotent.
for env in production preview development; do
  printf "%s" "$VAPID_PUBLIC_KEY" | npx vercel env rm VITE_VAPID_PUBLIC_KEY $env --yes 2>/dev/null || true
done
for env in production preview development; do
  printf "%s" "$VAPID_PUBLIC_KEY" | npx vercel env add VITE_VAPID_PUBLIC_KEY $env
done

echo ""
echo "▶ Step 3/7: redeploying Vercel production"
npx vercel --prod

echo ""
echo "▶ Step 4/7: ensuring Supabase CLI is installed"
if ! command -v supabase >/dev/null 2>&1; then
  echo "  Installing supabase CLI via Homebrew..."
  if ! command -v brew >/dev/null 2>&1; then
    echo "❌ Homebrew not found. Install from https://brew.sh first, then re-run this script."
    exit 1
  fi
  brew install supabase/tap/supabase
fi
supabase --version

echo ""
echo "▶ Step 5/7: linking to Supabase project ($PROJECT_REF)"
echo "  If this is your first time, you'll be prompted to log in via browser."
supabase login || true
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "▶ Step 6/7: pushing VAPID secrets to Supabase"
supabase secrets set \
  VAPID_PUBLIC_KEY="$VAPID_PUBLIC_KEY" \
  VAPID_PRIVATE_KEY="$VAPID_PRIVATE_KEY" \
  VAPID_SUBJECT="$VAPID_SUBJECT"

echo ""
echo "▶ Step 7/7: deploying the send-cycle-pushes Edge Function"
supabase functions deploy send-cycle-pushes --no-verify-jwt

echo ""
echo "✅ Done. Two manual steps remain (Supabase SQL editor):"
echo ""
echo "  1) Paste & run: migrations/2026-05-03_add_push_subscriptions.sql"
echo ""
echo "  2) Open migrations/2026-05-03_setup_push_cron.sql, replace"
echo "     <SERVICE_ROLE_KEY> with your service-role key from"
echo "     https://supabase.com/dashboard/project/$PROJECT_REF/settings/api,"
echo "     then paste & run."
echo ""
echo "Then smoke-test with:"
echo "  curl -X POST 'https://$PROJECT_REF.functions.supabase.co/send-cycle-pushes' \\"
echo "    -H 'Authorization: Bearer <SERVICE_ROLE_KEY>'"
