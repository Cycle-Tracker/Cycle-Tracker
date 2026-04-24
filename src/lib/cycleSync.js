import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * Couple-sync module.
 *
 * Data model (Supabase table `cycles`):
 *   - code (text, unique)           → the shareable code (e.g. ROSE-4872)
 *   - start_date (date)             → first day of the current cycle
 *   - durations (jsonb, int[4])     → phase durations
 *   - language (text)               → last language used
 *   - woman_name (text)             → first name of the cycle owner
 *   - man_name (text)               → first name of the supporting partner
 *   - questionnaire (jsonb)         → woman's answers for tip personalization
 *
 * Security: the table uses "public by code" RLS — anyone with the code can
 * read and write. The code itself is the secret, so we generate codes with
 * enough entropy (word + 4 digits ≈ 18 × 10000 = 180k combos) that guessing
 * an active partner's code is very unlikely.
 */

const WORDS = [
  "ROSE",
  "LUNE",
  "AMOUR",
  "SOLEIL",
  "FLEUR",
  "ETOILE",
  "JARDIN",
  "OCEAN",
  "REVE",
  "COEUR",
  "NUAGE",
  "PLUIE",
  "NEIGE",
  "AUBE",
  "POMME",
  "CERISE",
  "PAPILLON",
  "DOUX",
];

export function generateCode() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const digits = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${word}-${digits}`;
}

export function normalizeCode(input) {
  if (typeof input !== "string") return "";
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidCodeShape(code) {
  return /^[A-Z]+-\d{4}$/.test(normalizeCode(code));
}

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase n'est pas configuré (variables d'environnement manquantes)."
    );
  }
}

/**
 * Create a new shared cycle with a unique code and return the code.
 * Retries up to 5 times on code collisions.
 *
 * Accepted optional fields: womanName, manName, questionnaire.
 */
export async function createSharedCycle({
  startDate,
  durations,
  language,
  womanName,
  manName,
  questionnaire,
}) {
  ensureConfigured();

  const payload = {
    start_date: startDate,
    durations,
    language,
  };
  if (womanName !== undefined) payload.woman_name = womanName;
  if (manName !== undefined) payload.man_name = manName;
  if (questionnaire !== undefined) payload.questionnaire = questionnaire;

  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("cycles")
      .insert({ ...payload, code })
      .select()
      .single();

    if (!error) return { code, row: data };

    // 23505 = unique_violation in Postgres. Retry on collision.
    if (error.code === "23505") {
      lastError = error;
      continue;
    }
    throw error;
  }
  throw lastError ?? new Error("Impossible de générer un code unique.");
}

/**
 * Fetch a cycle by its code. Returns null if not found.
 */
export async function fetchSharedCycle(code) {
  ensureConfigured();
  const normalized = normalizeCode(code);
  const { data, error } = await supabase
    .from("cycles")
    .select("*")
    .eq("code", normalized)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Patch a shared cycle (partial update).
 */
export async function updateSharedCycle(code, patch) {
  ensureConfigured();
  const normalized = normalizeCode(code);
  const { data, error } = await supabase
    .from("cycles")
    .update(patch)
    .eq("code", normalized)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Subscribe to realtime UPDATE events on a given cycle.
 * Returns an unsubscribe function.
 */
export function subscribeToCycle(code, onUpdate) {
  if (!isSupabaseConfigured) return () => {};
  const normalized = normalizeCode(code);
  const channel = supabase
    .channel(`cycle-${normalized}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "cycles",
        filter: `code=eq.${normalized}`,
      },
      (payload) => {
        if (payload?.new) onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
