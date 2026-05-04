// Supabase Edge Function: send-cycle-pushes
//
// Reads every active cycle + its push subscriptions, decides which
// notifications are due TODAY, and sends them via Web Push (VAPID).
//
// Trigger: scheduled by pg_cron once per day (see migrations).
// Can also be called manually:
//   curl -X POST 'https://<project>.functions.supabase.co/send-cycle-pushes' \
//     -H 'Authorization: Bearer <anon-or-service-role-key>'
//
// Env vars (set via `supabase secrets set ...`):
//   SUPABASE_URL                 (auto-injected)
//   SUPABASE_SERVICE_ROLE_KEY    (auto-injected) — used to bypass RLS
//   VAPID_PUBLIC_KEY             — base64-url, generated locally with `npx web-push generate-vapid-keys`
//   VAPID_PRIVATE_KEY            — base64-url
//   VAPID_SUBJECT                — "mailto:you@example.com"
//
// Deploy:
//   supabase functions deploy send-cycle-pushes --no-verify-jwt
//
// (no-verify-jwt because pg_cron will call it without a JWT.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

import {
  buildCycles,
  classifyDay,
  diffDays,
  nextPeriodStart,
  currentOvulationDate,
  normalizeDate,
} from "./cycle-logic.ts";
import { computeNotifications } from "./compute-notifications.ts";

interface CycleRow {
  code: string;
  start_date: string;
  durations: number[];
  woman_name: string | null;
  man_name: string | null;
  language: string | null;
}

interface PushSub {
  cycle_code: string;
  role: "woman" | "man";
  endpoint: string;
  p256dh: string;
  auth: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT =
  Deno.env.get("VAPID_SUBJECT") || "mailto:noreply@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const isTest = url.searchParams.get("test") === "1";
    const result = isTest ? await runTest() : await runOnce();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-cycle-pushes failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err?.message || err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Test mode (`?test=1`): pushes a single hard-coded notification to every
 * subscription. Useful to validate end-to-end delivery (especially on iOS
 * where the cycle-driven schedule may have nothing to say today).
 */
async function runTest() {
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");
  if (error) throw error;
  if (!subs || subs.length === 0) {
    return { ok: true, sent: 0, reason: "no-subscriptions", mode: "test" };
  }

  const payload = JSON.stringify({
    title: "🌸 Cycle Tracker — test",
    body: "Si tu vois cette notif l'app fermée, le push de bout en bout fonctionne.",
    tag: "test-ping",
    url: "/",
  });

  let sent = 0;
  let failed = 0;
  const stale: string[] = [];

  for (const sub of subs as { endpoint: string; p256dh: string; auth: string }[]) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      sent++;
    } catch (err: any) {
      failed++;
      const status = err?.statusCode || err?.status;
      if (status === 410 || status === 404) stale.push(sub.endpoint);
      else console.warn("Test push failed:", sub.endpoint, status, err?.body || "");
    }
  }

  if (stale.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", stale);
  }

  return { ok: true, sent, failed, cleaned: stale.length, mode: "test" };
}

async function runOnce() {
  // 1. Fetch every cycle that has at least one push subscription.
  const { data: subs, error: subsErr } = await supabase
    .from("push_subscriptions")
    .select("cycle_code, role, endpoint, p256dh, auth");
  if (subsErr) throw subsErr;
  if (!subs || subs.length === 0) {
    return { ok: true, sent: 0, reason: "no-subscriptions" };
  }

  const codes = Array.from(new Set(subs.map((s: PushSub) => s.cycle_code)));

  const { data: cycles, error: cyclesErr } = await supabase
    .from("cycles")
    .select("code, start_date, durations, woman_name, man_name, language")
    .in("code", codes);
  if (cyclesErr) throw cyclesErr;

  const cycleByCode = new Map<string, CycleRow>();
  for (const c of cycles ?? []) cycleByCode.set(c.code, c);

  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  // 2. For each subscription, compute today's notifications and push.
  for (const sub of subs as PushSub[]) {
    const cycle = cycleByCode.get(sub.cycle_code);
    if (!cycle) continue;

    const lang = (cycle.language || "fr") as "fr" | "en" | "ru";
    const t = loadStrings(lang);

    const partnerName =
      sub.role === "woman" ? cycle.man_name : cycle.woman_name;
    const myName =
      sub.role === "woman" ? cycle.woman_name : cycle.man_name;

    const notifs = computeNotifications({
      startDate: cycle.start_date,
      durations: cycle.durations,
      role: sub.role,
      partnerName: partnerName ?? "",
      myName: myName ?? "",
      t,
    });

    for (const n of notifs) {
      // Skip the friendly placeholder.
      if (!n || !n.id || n.id === "calm") continue;

      const payload = JSON.stringify({
        title: `${n.icon || ""} ${n.title || ""}`.trim(),
        body: n.body || "",
        tag: n.id,
        url: "/",
      });

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent++;
      } catch (err: any) {
        failed++;
        // 410 Gone or 404 Not Found = endpoint no longer valid; remove it.
        const status = err?.statusCode || err?.status;
        if (status === 410 || status === 404) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.warn("Push failed:", sub.endpoint, status, err?.body || "");
        }
      }
    }
  }

  // 3. Cleanup expired subscriptions.
  if (staleEndpoints.length > 0) {
    const { error: delErr } = await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", staleEndpoints);
    if (delErr) console.warn("Cleanup delete failed:", delErr);
  }

  return {
    ok: true,
    sent,
    failed,
    cleaned: staleEndpoints.length,
  };
}

/**
 * Minimal i18n bundle for the notification strings — duplicates the
 * subset of src/i18n/<lang>.js needed to render OS-level pushes.
 *
 * Keep this in sync with the client-side notifications wording.
 */
function loadStrings(lang: "fr" | "en" | "ru") {
  const fr = {
    ui: {
      partnerFallback: "ta partenaire",
      notifPeriodTodayTitle: "Les règles ont commencé",
      notifPeriodTodayBodyMan: (name: string) =>
        `${name} pourrait apprécier un peu de douceur aujourd'hui.`,
      notifPeriodTodayBodyWoman:
        "Prends soin de toi aujourd'hui — repos et chaleur.",
      notifOvulationTodayTitle: "Pic d'ovulation aujourd'hui",
      notifOvulationTodayBodyMan: (name: string) =>
        `${name} est probablement à son énergie max — moment idéal pour un projet à deux.`,
      notifOvulationTodayBodyWoman:
        "Énergie au max — bon moment pour les projets et conversations importantes.",
      notifOvulationTomorrowTitle: "Ovulation demain",
      notifOvulationTomorrowBody: "Pic d'énergie attendu demain.",
      notifFertileTitle: "Fenêtre fertile",
      notifFertileBody: "Tu es dans la fenêtre fertile.",
      notifPeriodTomorrowTitle: "Règles attendues demain",
      notifPeriodInNTitle: (n: number) => `Règles dans ${n} jours`,
      notifPeriodSoonBodyMan: (name: string) =>
        `Anticipe : ${name} pourrait apprécier ta présence ces prochains jours.`,
      notifPeriodSoonBodyWoman:
        "Pense à prévoir un peu de confort pour les prochains jours.",
      notifCalmTitle: "Tout va bien ✨",
      notifCalmBody: (_n: string) => "Rien de notable aujourd'hui.",
    },
  };

  const en = {
    ui: {
      partnerFallback: "your partner",
      notifPeriodTodayTitle: "Period started",
      notifPeriodTodayBodyMan: (name: string) =>
        `${name} could use a little extra care today.`,
      notifPeriodTodayBodyWoman: "Take care of yourself today — rest and warmth.",
      notifOvulationTodayTitle: "Ovulation peak today",
      notifOvulationTodayBodyMan: (name: string) =>
        `${name} is probably at peak energy — great moment for a project together.`,
      notifOvulationTodayBodyWoman:
        "Peak energy — good time for important projects and conversations.",
      notifOvulationTomorrowTitle: "Ovulation tomorrow",
      notifOvulationTomorrowBody: "Energy peak expected tomorrow.",
      notifFertileTitle: "Fertile window",
      notifFertileBody: "You're in the fertile window.",
      notifPeriodTomorrowTitle: "Period expected tomorrow",
      notifPeriodInNTitle: (n: number) => `Period in ${n} days`,
      notifPeriodSoonBodyMan: (name: string) =>
        `Heads up: ${name} could appreciate your presence in the coming days.`,
      notifPeriodSoonBodyWoman: "Plan a bit of comfort for the next few days.",
      notifCalmTitle: "All good ✨",
      notifCalmBody: (_n: string) => "Nothing noteworthy today.",
    },
  };

  const ru = {
    ui: {
      partnerFallback: "твоя партнёрша",
      notifPeriodTodayTitle: "Месячные начались",
      notifPeriodTodayBodyMan: (name: string) =>
        `${name} могла бы оценить немного заботы сегодня.`,
      notifPeriodTodayBodyWoman:
        "Позаботься о себе сегодня — покой и тепло.",
      notifOvulationTodayTitle: "Пик овуляции сегодня",
      notifOvulationTodayBodyMan: (name: string) =>
        `${name} вероятно на пике энергии — отличный момент для совместного проекта.`,
      notifOvulationTodayBodyWoman:
        "Пик энергии — хорошее время для важных проектов и разговоров.",
      notifOvulationTomorrowTitle: "Овуляция завтра",
      notifOvulationTomorrowBody: "Завтра ожидается пик энергии.",
      notifFertileTitle: "Фертильное окно",
      notifFertileBody: "Ты в фертильном окне.",
      notifPeriodTomorrowTitle: "Месячные ожидаются завтра",
      notifPeriodInNTitle: (n: number) => `Месячные через ${n} дней`,
      notifPeriodSoonBodyMan: (name: string) =>
        `Имей в виду: ${name} оценит твоё присутствие в ближайшие дни.`,
      notifPeriodSoonBodyWoman:
        "Подумай о небольшом комфорте на ближайшие дни.",
      notifCalmTitle: "Всё хорошо ✨",
      notifCalmBody: (_n: string) => "Ничего особенного сегодня.",
    },
  };

  if (lang === "en") return en;
  if (lang === "ru") return ru;
  return fr;
}
