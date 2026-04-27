/**
 * Browser-level notifications.
 *
 * This is the "vraies notifs" layer that complements the in-app cloche.
 * It uses the standard Notification API to fire OS-level notifications
 * (system tray on desktop, notification center on Android, banner on iOS PWA
 * once the user has installed the app to the home screen and granted permission).
 *
 * Limits we accept on purpose:
 *  - No push server: notifications fire ONLY when the app is open (or when
 *    the Service Worker is active for the recently-opened PWA). True push
 *    notifications would require VAPID keys + a Supabase Edge Function +
 *    a subscriptions table, which is out of scope for this iteration.
 *  - We dedupe per notification id per local day so the user doesn't get
 *    spammed every time they reopen the app.
 *
 * Wiring:
 *  - Settings exposes a toggle that calls `requestBrowserNotificationPermission`.
 *  - CycleTracker.jsx watches `notifications` (from computeNotifications) and
 *    calls `fireNewNotifications` whenever the array changes.
 */

const LS_ENABLED_KEY = "cycle-os-notifs-enabled";
const LS_SEEN_KEY = "cycle-os-notifs-seen";

/* ---------- Capability ---------- */

export function isBrowserNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission() {
  if (!isBrowserNotificationSupported()) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

/* ---------- User preference ---------- */

export function isOsNotificationsEnabled() {
  try {
    return localStorage.getItem(LS_ENABLED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setOsNotificationsEnabled(enabled) {
  try {
    if (enabled) localStorage.setItem(LS_ENABLED_KEY, "true");
    else localStorage.removeItem(LS_ENABLED_KEY);
  } catch {
    // ignore (private mode etc.)
  }
}

/**
 * Ask the browser for permission. Returns the resolved permission string.
 * Safe to call multiple times — if the browser already decided, it just
 * returns the existing value without re-prompting.
 */
export async function requestBrowserNotificationPermission() {
  if (!isBrowserNotificationSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return "denied";
  }
}

/* ---------- Dedup store ---------- */
// We keep a small map: { "<YYYY-MM-DD>": ["id1", "id2", ...] }
// Entries from previous days are pruned on each read so the store stays small.

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function readSeen() {
  try {
    const raw = localStorage.getItem(LS_SEEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    // Prune anything older than today (we only care about same-day dedup).
    const today = todayKey();
    const pruned = {};
    if (Array.isArray(parsed[today])) pruned[today] = parsed[today];
    return pruned;
  } catch {
    return {};
  }
}

function writeSeen(map) {
  try {
    localStorage.setItem(LS_SEEN_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function markSeen(id) {
  const map = readSeen();
  const today = todayKey();
  if (!Array.isArray(map[today])) map[today] = [];
  if (!map[today].includes(id)) map[today].push(id);
  writeSeen(map);
}

function hasSeenToday(id) {
  const map = readSeen();
  const today = todayKey();
  return Array.isArray(map[today]) && map[today].includes(id);
}

/**
 * Reset the dedup store (useful for the "test notification" button so the
 * user can fire it more than once a day).
 */
export function clearOsNotificationDedup() {
  try {
    localStorage.removeItem(LS_SEEN_KEY);
  } catch {
    // ignore
  }
}

/* ---------- Firing ---------- */

/**
 * Show a single notification. Returns true if it was actually shown.
 *
 * Quietly no-ops if:
 *  - notifications are unsupported
 *  - permission isn't granted
 *  - the user toggle is off
 *  - we've already shown this id today (dedup)
 */
export function showOsNotification({ id, title, body, icon }) {
  if (!isBrowserNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;
  if (!isOsNotificationsEnabled()) return false;
  if (id && hasSeenToday(id)) return false;

  try {
    const n = new Notification(title || "Cycle", {
      body: body || "",
      icon: icon || "/pwa-192.png",
      badge: "/pwa-192.png",
      tag: id || undefined, // prevents stack-up of duplicates in the OS tray
    });
    // Bring the tab to front when the user clicks the notification.
    n.onclick = () => {
      try {
        window.focus();
        n.close();
      } catch {
        // ignore
      }
    };
    if (id) markSeen(id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fire OS notifications for any computed notification we haven't fired yet
 * today. Skips the friendly "calm" placeholder.
 *
 * `notifications` is the array produced by computeNotifications().
 */
export function fireNewNotifications(notifications) {
  if (!Array.isArray(notifications)) return 0;
  let fired = 0;
  for (const n of notifications) {
    if (!n || !n.id || n.id === "calm") continue;
    const ok = showOsNotification({
      id: n.id,
      title: `${n.icon || ""} ${n.title || ""}`.trim(),
      body: n.body || "",
    });
    if (ok) fired += 1;
  }
  return fired;
}
