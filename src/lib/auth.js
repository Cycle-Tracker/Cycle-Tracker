import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * Auth helpers built on top of Supabase Auth (email + password).
 *
 * Account is optional: the app must keep working without auth (the original
 * "code-only" flow). When a user IS logged in, we additionally:
 *   - auto-link any cycle they create to their account (owner_id)
 *   - auto-link any cycle they join to their account (partner_id)
 *   - on app boot, look up their cycle row and pre-fill the share code so
 *     they don't have to retype it.
 */

function ensureAuth() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase n'est pas configuré (variables d'environnement manquantes)."
    );
  }
  return supabase;
}

export async function signUp({ email, password }) {
  const sb = ensureAuth();
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const sb = ensureAuth();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const sb = ensureAuth();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

/**
 * Subscribe to auth state changes. Returns an unsubscribe function.
 *   onChange(session) — null when logged out, session object when logged in.
 */
export function onAuthStateChange(onChange) {
  if (!isSupabaseConfigured) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session ?? null);
  });
  return () => data?.subscription?.unsubscribe();
}

/**
 * Link an existing cycle to a user, on the column matching their role.
 *   role === "woman" → owner_id
 *   role === "man"   → partner_id
 *
 * Safe to call repeatedly (idempotent — re-writes the same id).
 */
export async function linkCycleToUser({ code, userId, role }) {
  if (!isSupabaseConfigured || !code || !userId) return;
  const column = role === "woman" ? "owner_id" : "partner_id";

  // Safety: refuse to overwrite a slot already claimed by a *different* user.
  // Without this, stale local state (wrong role from previous testing) could
  // cause us to accidentally claim someone else's cycle as our own.
  try {
    const { data: existing, error: readErr } = await supabase
      .from("cycles")
      .select(column)
      .eq("code", code)
      .maybeSingle();
    if (readErr) {
      console.warn("linkCycleToUser pre-check read failed:", readErr);
      return;
    }
    if (existing && existing[column] && existing[column] !== userId) {
      console.warn(
        `linkCycleToUser: ${column} already claimed by another user on cycle ${code}; skipping`
      );
      return;
    }
  } catch (err) {
    console.warn("linkCycleToUser pre-check threw:", err);
    return;
  }

  const { error } = await supabase
    .from("cycles")
    .update({ [column]: userId })
    .eq("code", code);
  if (error) {
    // Don't throw — linking is a "nice to have", not blocking.
    console.warn("linkCycleToUser failed:", error);
  }
}

/**
 * Find the cycle code linked to the given user (as owner OR partner).
 * Returns the cycle row, or null if none.
 */
export async function findCycleForUser(userId) {
  if (!isSupabaseConfigured || !userId) return null;
  const { data, error } = await supabase
    .from("cycles")
    .select("*")
    .or(`owner_id.eq.${userId},partner_id.eq.${userId}`)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("findCycleForUser failed:", error);
    return null;
  }
  return data ?? null;
}

/**
 * Detach the user from EVERY cycle they're linked to (both as owner and as
 * partner). Used when the user wants a clean slate — e.g. when they
 * disconnect from a shared cycle, so a stale link can't snap them back to
 * a wrong code on the next page load.
 *
 * Optionally pass `exceptCode` to keep one cycle linked (useful when
 * switching from one code to another: unlink everything else).
 */
export async function unlinkAllCyclesForUser(userId, { exceptCode } = {}) {
  if (!isSupabaseConfigured || !userId) return;
  try {
    // Owner side
    let q1 = supabase
      .from("cycles")
      .update({ owner_id: null })
      .eq("owner_id", userId);
    if (exceptCode) q1 = q1.neq("code", exceptCode);
    const { error: e1 } = await q1;
    if (e1) console.warn("unlinkAllCyclesForUser (owner) failed:", e1);

    // Partner side
    let q2 = supabase
      .from("cycles")
      .update({ partner_id: null })
      .eq("partner_id", userId);
    if (exceptCode) q2 = q2.neq("code", exceptCode);
    const { error: e2 } = await q2;
    if (e2) console.warn("unlinkAllCyclesForUser (partner) failed:", e2);
  } catch (err) {
    console.warn("unlinkAllCyclesForUser threw:", err);
  }
}

/**
 * Delete the current user's account.
 *
 * Supabase JS doesn't expose a client-side delete for the logged-in user
 * (auth.admin.deleteUser requires the service_role key). We call a Postgres
 * function `delete_user()` with `security definer` that:
 *   - detaches cycles (sets owner_id/partner_id to null where they match
 *     the current user) so the partner can keep using the cycle
 *   - deletes the auth.users row for auth.uid()
 *
 * The function must exist in Supabase. Setup SQL (run once):
 *
 *   create or replace function public.delete_user()
 *   returns void
 *   language plpgsql
 *   security definer
 *   set search_path = public, auth
 *   as $$
 *   declare uid uuid := auth.uid();
 *   begin
 *     if uid is null then
 *       raise exception 'not authenticated';
 *     end if;
 *     update public.cycles set owner_id   = null where owner_id   = uid;
 *     update public.cycles set partner_id = null where partner_id = uid;
 *     delete from auth.users where id = uid;
 *   end;
 *   $$;
 *
 *   revoke all on function public.delete_user() from public, anon;
 *   grant execute on function public.delete_user() to authenticated;
 *
 * After deletion the local session is invalidated; caller should also
 * call signOut() and clear local storage.
 */
export async function deleteMyAccount() {
  const sb = ensureAuth();
  const { error } = await sb.rpc("delete_user");
  if (error) throw error;
}
