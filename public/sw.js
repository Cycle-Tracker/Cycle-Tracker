/* eslint-disable no-restricted-globals */
/**
 * Cycle Tracker — Service Worker.
 *
 * Two responsibilities:
 *   1. Receive `push` events from Supabase Edge Function (via Web Push +
 *      VAPID) and display them as OS notifications, even when the app is
 *      closed.
 *   2. Handle clicks on notifications — focus an existing tab if there is
 *      one, otherwise open the app at the root.
 *
 * Note: this SW is intentionally minimal — no offline cache, no asset
 * pre-fetch. Vite already serves the app as a SPA and we don't want a
 * stale bundle to be served after a deploy.
 */

self.addEventListener("install", (event) => {
  // Activate immediately on install — we don't have a controlled fetch
  // strategy, so there's nothing to wait for.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    // Non-JSON payload — fall back to text.
    try {
      data = { title: event.data?.text() || "Cycle Tracker", body: "" };
    } catch {
      data = { title: "Cycle Tracker", body: "" };
    }
  }

  const title = data.title || "Cycle Tracker";
  const options = {
    body: data.body || "",
    icon: data.icon || "/pwa-192.png",
    badge: data.badge || "/pwa-192.png",
    tag: data.tag || data.id || undefined,
    // Re-fire even if a notification with the same tag is already shown,
    // so a follow-up reminder isn't silently dropped.
    renotify: !!data.tag,
    data: {
      url: data.url || "/",
      ...data.data,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // If a tab is already open on our origin, focus it instead of
      // opening a new one.
      for (const client of allClients) {
        try {
          const url = new URL(client.url);
          if (url.origin === self.location.origin) {
            await client.focus();
            return;
          }
        } catch {
          // ignore parse errors
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
