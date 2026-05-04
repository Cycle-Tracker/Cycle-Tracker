/**
 * Web Push subscription management.
 *
 * Wraps the navigator.serviceWorker + PushManager APIs and persists the
 * resulting subscription on Supabase so the Edge Function can find it.
 *
 * Capability check sequence:
 *   1. browser supports Service Workers
 *   2. browser supports PushManager
 *   3. user has granted Notification permission (we don't request it here —
 *      that's done in NotifPrompt / Settings via the existing flow)
 *   4. a VAPID public key is configured at build time (VITE_VAPID_PUBLIC_KEY)
 *
 * If any step fails, this module degrades quietly — the in-app notification
 * cloche keeps working, only the OS-level "app closed" pushes are missing.
 */

import { supabase, isSupabaseConfigured } from "../lib/supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

/* -------- capability -------- */

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isPushConfigured() {
  return Boolean(VAPID_PUBLIC_KEY);
}

/* -------- vapid key helper -------- */

/**
 * Convert a base64-url string into a Uint8Array, as required by
 * pushManager.subscribe({ applicationServerKey }).
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/* -------- service worker reg -------- */

let swRegPromise = null;

/**
 * Register (or return the existing registration of) the Service Worker.
 * Cached as a promise so the SW is only registered once per page load.
 */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  if (swRegPromise) return swRegPromise;
  swRegPromise = navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .catch((err) => {
      console.warn("Service Worker registration failed:", err);
      return null;
    });
  return swRegPromise;
}

/* -------- subscription -------- */

/**
 * Get the current PushSubscription if any. Does NOT request permission.
 */
export async function getCurrentPushSubscription() {
  if (!isPushSupported()) return null;
  const reg = await registerServiceWorker();
  if (!reg) return null;
  try {
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Subscribe this device to push notifications and persist it on Supabase.
 *
 * Caller must ensure Notification.permission === 'granted' before calling.
 *
 * Returns: { ok: true } on success, { ok: false, reason } otherwise.
 */
export async function subscribeToPush({ cycleCode, role, userId = null }) {
  if (!isPushSupported()) {
    return { ok: false, reason: "unsupported" };
  }
  if (!isPushConfigured()) {
    return { ok: false, reason: "no-vapid-key" };
  }
  if (!isSupabaseConfigured) {
    return { ok: false, reason: "no-supabase" };
  }
  if (Notification.permission !== "granted") {
    return { ok: false, reason: "no-permission" };
  }
  if (!cycleCode || !role) {
    return { ok: false, reason: "missing-cycle-or-role" };
  }

  const reg = await registerServiceWorker();
  if (!reg) return { ok: false, reason: "no-sw" };

  let sub;
  try {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  } catch (err) {
    console.warn("pushManager.subscribe failed:", err);
    return { ok: false, reason: "subscribe-failed", error: err };
  }

  try {
    await persistSubscription({ subscription: sub, cycleCode, role, userId });
    return { ok: true, subscription: sub };
  } catch (err) {
    console.warn("persistSubscription failed:", err);
    // Try to undo the subscription so we're not silently signed up to a push
    // service whose endpoint isn't stored anywhere.
    try {
      await sub.unsubscribe();
    } catch {
      // ignore
    }
    return { ok: false, reason: "persist-failed", error: err };
  }
}

/**
 * Unsubscribe this device from pushes (and remove the row on Supabase).
 */
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  const sub = await getCurrentPushSubscription();
  if (!sub) return { ok: true, alreadyUnsubscribed: true };

  let endpoint = null;
  try {
    endpoint = sub.endpoint;
  } catch {
    // ignore
  }

  try {
    await sub.unsubscribe();
  } catch (err) {
    console.warn("PushSubscription.unsubscribe failed:", err);
  }

  if (endpoint && isSupabaseConfigured) {
    try {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint);
    } catch (err) {
      console.warn("delete push_subscriptions row failed:", err);
    }
  }

  return { ok: true };
}

/**
 * Update the cycle_code on the existing subscription row when the user
 * switches to a different cycle (e.g. joins a new partner code). Keeps the
 * push endpoint but reroutes which cycle's notifications go to it.
 */
export async function updatePushSubscriptionCycle({ cycleCode, role, userId = null }) {
  if (!isPushSupported() || !isSupabaseConfigured) return;
  const sub = await getCurrentPushSubscription();
  if (!sub) return;
  try {
    await persistSubscription({ subscription: sub, cycleCode, role, userId });
  } catch (err) {
    console.warn("updatePushSubscriptionCycle failed:", err);
  }
}

/* -------- supabase persistence -------- */

async function persistSubscription({ subscription, cycleCode, role, userId }) {
  const json = subscription.toJSON();
  const p256dh = json?.keys?.p256dh;
  const auth = json?.keys?.auth;
  if (!subscription.endpoint || !p256dh || !auth) {
    throw new Error("Subscription is missing endpoint or keys");
  }

  const row = {
    user_id: userId,
    cycle_code: cycleCode,
    role,
    endpoint: subscription.endpoint,
    p256dh,
    auth,
  };

  // Upsert on `endpoint` (unique key).
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(row, { onConflict: "endpoint" });
  if (error) throw error;
}
