/**
 * Merge base tips with extraTips that match the user's questionnaire tags.
 *
 * A phase's localized payload looks like:
 *   {
 *     name, mood,
 *     tips:       ["always shown 1", "always shown 2", ...],
 *     extraTips:  [{ text, tags: ["emotional-pms"] }, ...],
 *     avoid:      [...]
 *   }
 *
 * Matching rules:
 *   - An extraTip is shown if ANY of its tags is in userTags.
 *   - If none of the tags match, the extraTip is hidden.
 *   - If tags is empty, the extraTip is always shown (defensive).
 *
 * Returns { tips, avoid } — a merged tip array + the untouched avoid list.
 * The caller can use them interchangeably with the old (non-personalized)
 * rendering code.
 */
export function personalizePhaseTips(localizedPhase, userTags) {
  const base = Array.isArray(localizedPhase?.tips) ? localizedPhase.tips : [];
  const avoid = Array.isArray(localizedPhase?.avoid) ? localizedPhase.avoid : [];
  const extras = Array.isArray(localizedPhase?.extraTips)
    ? localizedPhase.extraTips
    : [];

  const tagsSet =
    userTags instanceof Set ? userTags : new Set(userTags || []);

  const matchedExtras = extras
    .filter((extra) => {
      if (!extra || !extra.text) return false;
      if (!Array.isArray(extra.tags) || extra.tags.length === 0) return true;
      return extra.tags.some((tag) => tagsSet.has(tag));
    })
    .map((extra) => extra.text);

  return {
    tips: [...base, ...matchedExtras],
    avoid,
  };
}
