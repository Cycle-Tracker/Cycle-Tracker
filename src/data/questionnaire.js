/**
 * Questionnaire structure — the woman fills this in during onboarding
 * (or later from settings). Answers are stored as { [questionId]: optionValue }
 * in the `questionnaire` JSONB column of the `cycles` table.
 *
 * Each question has:
 *   - id: stable key used in the answers map
 *   - i18nKey: which key in locale.questionnaire.questions to use
 *   - options: list of choices, each with { value, i18nKey }
 *
 * The UI renders the localized strings by looking them up in the current
 * locale's questionnaire section.
 */

export const QUESTIONS = [
  {
    id: "painIntensity",
    i18nKey: "painIntensity",
    options: [
      { value: "high", i18nKey: "high" },
      { value: "medium", i18nKey: "medium" },
      { value: "low", i18nKey: "low" },
    ],
  },
  {
    id: "periodTouch",
    i18nKey: "periodTouch",
    options: [
      { value: "lots", i18nKey: "lots" },
      { value: "space", i18nKey: "space" },
      { value: "depends", i18nKey: "depends" },
    ],
  },
  {
    id: "emotionalPms",
    i18nKey: "emotionalPms",
    options: [
      { value: "often", i18nKey: "often" },
      { value: "sometimes", i18nKey: "sometimes" },
      { value: "rarely", i18nKey: "rarely" },
    ],
  },
  {
    id: "physicalPms",
    i18nKey: "physicalPms",
    options: [
      { value: "often", i18nKey: "often" },
      { value: "sometimes", i18nKey: "sometimes" },
      { value: "rarely", i18nKey: "rarely" },
    ],
  },
  {
    id: "tired",
    i18nKey: "tired",
    options: [
      { value: "gentle", i18nKey: "gentle" },
      { value: "alone", i18nKey: "alone" },
      { value: "ask", i18nKey: "ask" },
    ],
  },
  {
    id: "loveLanguage",
    i18nKey: "loveLanguage",
    options: [
      { value: "words", i18nKey: "words" },
      { value: "hugs", i18nKey: "hugs" },
      { value: "attention", i18nKey: "attention" },
      { value: "space", i18nKey: "space" },
    ],
  },
  {
    id: "comfortFood",
    i18nKey: "comfortFood",
    options: [
      { value: "helps", i18nKey: "helps" },
      { value: "weighs", i18nKey: "weighs" },
      { value: "depends", i18nKey: "depends" },
    ],
  },
  {
    id: "lightExercise",
    i18nKey: "lightExercise",
    options: [
      { value: "good", i18nKey: "good" },
      { value: "no", i18nKey: "no" },
      { value: "depends", i18nKey: "depends" },
    ],
  },
];

/**
 * Convert the answers map into a set of "tags" we can match against tips.
 * A tag like "want-hugs-on-period" means: during menstrual phase, prioritise
 * hug-related tips. A tag like "avoid-food-suggestions" means: hide tips
 * that suggest food/comfort eating.
 */
export function tagsFromAnswers(answers) {
  const a = answers || {};
  const tags = new Set();

  // Pain
  if (a.painIntensity === "high") tags.add("painful-periods");
  if (a.painIntensity === "low") tags.add("light-periods");

  // Touch during period
  if (a.periodTouch === "lots") tags.add("wants-affection-menstrual");
  if (a.periodTouch === "space") tags.add("wants-space-menstrual");

  // Emotional PMS
  if (a.emotionalPms === "often") tags.add("emotional-pms");

  // Physical PMS
  if (a.physicalPms === "often") tags.add("physical-pms");

  // Tired
  if (a.tired === "gentle") tags.add("offer-gentle-activities");
  if (a.tired === "alone") tags.add("leave-her-alone-when-tired");
  if (a.tired === "ask") tags.add("ask-when-tired");

  // Love language
  if (a.loveLanguage === "words") tags.add("love-words");
  if (a.loveLanguage === "hugs") tags.add("love-hugs");
  if (a.loveLanguage === "attention") tags.add("love-attention");
  if (a.loveLanguage === "space") tags.add("love-space");

  // Food
  if (a.comfortFood === "helps") tags.add("food-helps");
  if (a.comfortFood === "weighs") tags.add("avoid-food-suggestions");

  // Exercise
  if (a.lightExercise === "good") tags.add("exercise-helps");
  if (a.lightExercise === "no") tags.add("avoid-exercise-suggestions");

  return tags;
}
