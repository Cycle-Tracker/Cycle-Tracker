const en = {
  code: "en",
  label: "English",
  short: "EN",
  flag: "🇬🇧",
  htmlLang: "en",

  ui: {
    appTitle: "Cycle Tracker",
    appSubtitle: "Elegant, discreet cycle tracking",
    settingsOpenAria: "Open settings",
    settingsTitle: "Settings",
    settingsSectionLabel: "Settings",
    totalCycleLabel: "Total cycle:",
    daysUnit: "days",
    dayShort: "d",
    minSuffix: "d min",
    maxSuffix: "d max",
    startDateLabel: "First day of last period",
    resetButton: "Reset",
    currentPhaseLabel: "Current phase",
    energyLabel: "Energy",
    periodInPrefix: "Next period estimated in",
    periodInDays: (n) => `${n} ${n === 1 ? "day" : "days"}`,
    periodTodayLabel: "Period in progress",
    tabTips: "Tips",
    tabAll: "All phases",
    canDoTitle: "What you can do",
    avoidTitle: "Avoid",
    nowBadge: "• now",
    logPeriodButton: "Period started today",
    logPeriodConfirm:
      "Mark today as day 1 of the cycle? (The start date will be updated.)",
    footerLine1: "Every person is different.",
    footerLine2:
      "The most reliable thing is always to ask her what she needs.",
    languageLabel: "Language",

    // ===== Multi-step onboarding =====
    stepPrev: "← Back",
    stepNext: "Next →",
    stepFinish: "Finish",
    stepSkip: "Skip",
    stepProgress: (current, total) => `${current} / ${total}`,

    // Step: language
    stepLangTitle: "Pick your language",
    stepLangSubtitle: "You can change it later.",

    // Step: name
    stepNameTitle: "What's your name?",
    stepNameSubtitle: "Your first name is only used to personalize the app.",
    stepNamePlaceholder: "Your first name",

    // Step: role
    stepRoleTitle: "You are...",
    stepRoleSubtitle:
      "The app adapts depending on whether you live the cycle or support someone through it.",
    roleWoman: "The one living the cycle",
    roleWomanDesc: "You want to understand your body and anticipate.",
    roleMan: "The partner",
    roleManDesc: "You want to understand her better and be there for her.",

    // Step: questionnaire intro
    stepQuestTitle: "A few questions about you",
    stepQuestSubtitle:
      "Your answers help personalize the tips your partner will see. You can skip this step.",

    // Step: partner choice
    stepShareTitle: "Share with your partner?",
    stepShareSubtitle:
      "You'll both see the same info in real time on both phones.",

    // Step: cycle dates (woman)
    stepCycleTitle: "Your last cycle",
    stepCycleSubtitle:
      "When did your last period start? You can adjust durations afterwards.",

    // Step: cycle dates (man, about his partner)
    stepCycleTitleMan: "Your partner's cycle",
    stepCycleSubtitleMan:
      "When did her last period start? You can adjust the durations together later.",

    // Step: join
    stepJoinTitle: "Join a cycle",
    stepJoinSubtitle:
      "Enter the code your partner gave you (e.g. ROSE-4872).",

    // Onboarding choice (solo vs couple)
    choiceTitle: "How do you want to use the app?",
    choiceSubtitle:
      "Use it on your own, or share it with your partner to stay in sync.",
    choiceCreateTitle: "Create a shared cycle",
    choiceCreateDesc:
      "You'll get a code to share with your partner. You'll both see the same info in real time.",
    choiceJoinTitle: "Join with a code",
    choiceJoinDesc:
      "Enter the code your partner gave you to see the cycle.",
    choiceSoloTitle: "Use on your own",
    choiceSoloDesc:
      "Data stays on your device. You can turn on sharing later.",

    // Join cycle screen
    joinTitle: "Join a cycle",
    joinSubtitle: "Enter the sharing code (e.g. ROSE-4872).",
    joinPlaceholder: "ROSE-4872",
    joinButton: "Join",
    joinBack: "← Back",
    joinErrorInvalid: "Invalid code. Expected format: WORD-1234.",
    joinErrorNotFound: "No cycle found with this code.",
    joinErrorNetwork: "Connection issue. Try again in a moment.",
    joinLoading: "Connecting...",

    // Create shared
    createLoading: "Creating shared cycle...",
    createError: "Couldn't create the shared cycle. Try again.",

    // Share section in settings
    shareSectionLabel: "Sharing",
    shareActiveLabel: "Shared cycle active",
    shareCodeLabel: "Code to share",
    shareCopyButton: "Copy",
    shareCopiedLabel: "Copied ✓",
    shareHelp:
      "Share this code with your partner. They can enter it in the app to view and edit the cycle.",
    shareDisconnectButton: "Disconnect from shared cycle",
    shareDisconnectTitle: "Disconnect?",
    shareDisconnectMsg: (name) =>
      name
        ? `Are you sure you want to disconnect from ${name}? 🥺`
        : "Are you sure you want to disconnect from the shared cycle? 🥺",
    shareDisconnectHelp:
      "Data will remain on Supabase. You can come back with the same code.",
    shareDisconnectConfirm: "Yes, disconnect",
    shareDisconnectCancel: "Cancel",
    shareEnableButton: "Enable sharing",
    shareEnableHelp: "Create a code to share this cycle.",
    shareJoinButton: "Join an existing code",
    shareJoinHelp: "Already have a code? Connect to it.",
    shareOfflineLabel: "Offline mode — sharing is unavailable.",
    syncIndicatorSynced: "Synced",
    syncIndicatorOffline: "Offline",

    // Names
    myNameLabel: "Your first name",
    partnerNameLabel: "Partner's first name",
    yourNameHint: "(optional)",

    // Questionnaire management
    questEditTitle: "Your preferences",
    questEditSubtitle:
      "Your answers personalize what your partner sees.",
    questEditButton: "Edit my answers",
    questSavedLabel: "Preferences saved ✓",

    // Role in settings
    roleSectionLabel: "Your role",

    // Woman dashboard extras
    womanPeriodInLabel: "Next period",
    womanPeriodTodayLabel: "Your period has started",
    womanCyclePhaseLabel: "You're in phase",
    womanAnticipateTitle: "Anticipate",
    womanAnticipateMenstrual: "Period is coming. Prepare your comfort.",
    womanAnticipateOvulatory:
      "You're at peak energy. Use it for what matters.",
    womanAnticipateLuteal:
      "Your body is preparing for your period. Tiredness may come.",
    womanAnticipateFollicular:
      "Energy is coming back. It's your creative moment.",
    womanBadgeSolo: "Solo",
    womanSelfCareTitle: "Take care of yourself",
    womanSelfAvoidTitle: "Be mindful of",

    // Man dashboard extras
    manHelloLabel: (name) => (name ? `Hi ${name}` : "Hi"),
    manCurrentlyLabel: (partnerName) =>
      partnerName ? `${partnerName} is in phase` : "She's in phase",
    manWhatToDoTitle: "What you can do for her",
    manWhatToAvoidTitle: "Avoid right now",
    manMoodLabel: "Her likely mood",
    manPartnerMissingName: "your partner",
    manTabNow: "Right now",
    manTabAll: "All phases",
    manPeriodInLabel: "Next period",
    manPeriodTodayLabel: "Her period has started",
    manTraverseTitle: "What she's going through",
    manTraverseMenstrual:
      "She may feel drained, more sensitive, and have physical pain. Her tiredness isn't a mood — it's biological.",
    manTraverseFollicular:
      "Her energy is gradually returning. Motivation, focus and creativity are on the rise.",
    manTraverseOvulatory:
      "This is her peak — confident, social, comfortable in her body. Lots of energy available.",
    manTraverseLuteal:
      "Her patience may wear thin and emotions amplify (irritation, easy tears). It's not aimed at you.",

    // Phase info popup
    phaseInfoAria: "Learn more about this phase",
    phaseInfoTitle: "About this phase",
    phaseInfoClose: "Close",

    // Questionnaire re-edit from settings
    questReEditOpen: "Edit my answers",
    questReEditSave: "Save",
    questReEditReset: "Clear all",
  },

  questionnaire: {
    introTitle: "A few questions",
    introSubtitle:
      "Answer in a few seconds. It helps adapt the tips.",
    questionCounter: (current, total) => `Question ${current} of ${total}`,
    finish: "Finish questionnaire",

    questions: {
      painIntensity: "Your periods are usually...",
      periodTouch: "During your period, you prefer...",
      emotionalPms: "Emotional PMS (before your period)",
      physicalPms: "Physical PMS (headache, bloating...)",
      tired: "When you're tired, you'd rather he...",
      loveLanguage: "Your preferred way of being supported",
      comfortFood: "Sweets / comfort food during your period",
      lightExercise: "Light exercise during your period",
    },

    options: {
      high: "Painful",
      medium: "Moderate",
      low: "Light",

      lots: "Lots of cuddles",
      space: "Some space",
      depends: "It depends",

      often: "Often",
      sometimes: "Sometimes",
      rarely: "Rarely",

      gentle: "Suggests gentle activities",
      alone: "Leaves you alone",
      ask: "Just asks you directly",

      words: "Kind words",
      hugs: "Hugs",
      attention: "Small attentions",
      // space reused

      helps: "It helps me",
      weighs: "It weighs me down",
      // depends reused

      good: "It feels good",
      no: "No thanks",
      // depends reused
    },
  },

  phases: {
    menstrual: {
      name: "Menstrual",
      mood: "Sensitive · Tired · Variable",
      description:
        "Period: the uterine lining sheds, causing bleeding. Energy is at its lowest, the body needs rest. Often accompanied by cramps, fatigue, and emotional sensitivity.",
      tips: [
        "Prepare a hot water bottle",
        "Check the stock of menstrual products",
        "Be gentle and patient",
        "Plan for comfort and calm",
      ],
      extraTips: [
        { text: "Offer a pain reliever (she often takes one)", tags: ["painful-periods"] },
        { text: "Hugs and contact: she likes to be close", tags: ["wants-affection-menstrual", "love-hugs"] },
        { text: "Give her space — she prefers that", tags: ["wants-space-menstrual", "love-space"] },
        { text: "Suggest her favorite comfort snack", tags: ["food-helps"] },
        { text: "Kind words to remind her you're there", tags: ["love-words"] },
        { text: "Small attentions (blanket, soft lights, herbal tea)", tags: ["love-attention"] },
        { text: "A gentle walk if she feels like moving", tags: ["exercise-helps"] },
      ],
      avoid: [
        "Downplaying her pain",
        "Planning something heavy without asking her first",
        "Making remarks about her mood",
      ],
      selfCare: [
        "Rest: your body needs calm right now",
        "Hydrate (water, chamomile or raspberry leaf tea)",
        "Hot water bottle on the belly for cramps",
        "Iron-rich foods (lentils, spinach, red meat)",
        "Gentle walk or yoga if you feel up to it",
        "Cancel without guilt anything that asks too much",
      ],
      selfAvoid: [
        "Excess caffeine — can amplify cramps",
        "Alcohol — worsens mood swings, dehydrates",
        "Intense exercise if you're not feeling it",
        "Judging yourself for low energy",
      ],
    },
    follicular: {
      name: "Follicular",
      mood: "Energetic · Creative · Sociable",
      description:
        "Follicular phase: estrogen rises and prepares ovulation. Energy gradually returns, mood brightens, motivation and creativity peak. Often the best moment to start new projects.",
      tips: [
        "Plan activities together",
        "Often a good time for meaningful conversations",
        "Support her projects",
        "Enjoy the often higher energy level",
      ],
      extraTips: [
        { text: "Suggest a sporty outing — she may enjoy it", tags: ["exercise-helps"] },
        { text: "Let her lead the plans — she's in her flow", tags: ["love-space"] },
      ],
      avoid: [
        "Don't assume — just ask her how she's feeling",
      ],
      selfCare: [
        "Enjoy the energy coming back",
        "Good time to start new projects",
        "More intense exercise possible (cardio, strength)",
        "Great period for learning and focus",
        "Socialize — your mood naturally lifts",
      ],
      selfAvoid: [
        "Overloading: energy is here, don't burn it",
        "Ignoring fatigue if it shows up anyway",
      ],
    },
    ovulatory: {
      name: "Ovulation",
      mood: "Confident · Radiant · Communicative",
      description:
        "Ovulation: an ovary releases an egg. Estrogen and testosterone peak, which often brings confidence, sociability and higher libido. Fertility window.",
      tips: [
        "Suggest a nice moment together",
        "Be attentive and appreciative",
        "Good time to talk if she feels like it",
        "Enjoy the natural closeness",
      ],
      extraTips: [
        { text: "Tell her she looks beautiful", tags: ["love-words"] },
        { text: "A long, real hug — she'll enjoy it", tags: ["love-hugs"] },
      ],
      avoid: ["Don't assume everything is always easy"],
      selfCare: [
        "Enjoy the confidence and radiance",
        "Good moment for presentations, interviews, important conversations",
        "Hydrate well: your body loses more water",
        "Higher libido: it's normal and healthy",
        "Maximum sociability — see your loved ones",
      ],
      selfAvoid: [
        "Impulsive decisions driven by confidence",
        "Forgetting contraception if no baby plans (peak fertility)",
        "Over-planning — your energy is still finite",
      ],
    },
    luteal: {
      name: "Luteal",
      mood: "Variable · Sensitive · Tired",
      description:
        "Luteal phase: progesterone dominates, energy slowly decreases. The body prepares either for pregnancy or for the next period. PMS may appear: mood swings, bloating, sensitivity, fatigue.",
      tips: [
        "Listen without trying to fix everything",
        "Lighten her mental load if possible",
        "Anticipate her need for comfort",
        "Stay patient",
      ],
      extraTips: [
        { text: "She may be emotional: welcome it without commenting", tags: ["emotional-pms"] },
        { text: "Headache? Offer pain reliever + water + a quiet room", tags: ["physical-pms"] },
        { text: "Suggest a calm activity (movie, cooking, walk)", tags: ["offer-gentle-activities"] },
        { text: "Let her have some alone time if she prefers", tags: ["leave-her-alone-when-tired"] },
        { text: "Just ask her what she feels like", tags: ["ask-when-tired"] },
        { text: "Bring her a small sweet treat if she likes", tags: ["food-helps"] },
      ],
      avoid: [
        "\"That's just your PMS talking\"",
        "Avoidable conflicts",
        "Unnecessary social pressure",
      ],
      selfCare: [
        "Take care of yourself: your body is doing a lot quietly",
        "Magnesium for PMS (dark chocolate, almonds, banana)",
        "Sleep is a priority — you may need more",
        "Gentle activity: yoga, stretching, walking",
        "Track your symptoms to know yourself better",
        "Be kind to yourself",
      ],
      selfAvoid: [
        "Self-criticism — it's hormones talking, not you",
        "Excess refined sugar — amplifies mood swings",
        "Important conflicts — postpone if possible",
        "Comparing your mood to the start of the cycle",
      ],
    },
  },
};

export default en;
