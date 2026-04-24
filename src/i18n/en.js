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
    settingsSectionLabel: "Phase settings",
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
    welcomeTitle: "Welcome",
    welcomeSubtitle: "Let's set up the cycle before we start.",
    welcomeLangStep: "1. Language",
    welcomeDateStep: "2. Start of the last cycle",
    welcomePhasesStep: "3. Phase durations (optional)",
    welcomePhasesHelp:
      "You can keep the defaults and fine-tune them later.",
    welcomeStartButton: "Get started",

    // Onboarding choice (solo vs couple)
    choiceTitle: "How do you want to use the app?",
    choiceSubtitle:
      "Use it on your own, or share it with her so you stay in sync.",
    choiceCreateTitle: "Create a shared cycle",
    choiceCreateDesc:
      "You'll get a code to share with your partner. You'll both see the same info in real time.",
    choiceJoinTitle: "Join with a code",
    choiceJoinDesc:
      "Enter the code your partner gave you to see her cycle.",
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
      "Share this code with her. She can enter it in the app to view and edit the cycle.",
    shareDisconnectButton: "Disconnect from shared cycle",
    shareDisconnectConfirm:
      "Disconnect from the shared cycle? Data will remain on Supabase and accessible via the code.",
    shareEnableButton: "Enable sharing",
    shareEnableHelp:
      "Create a code to share this cycle with your partner.",
    shareOfflineLabel: "Offline mode — sharing is unavailable.",
    syncIndicatorSynced: "Synced",
    syncIndicatorOffline: "Offline",
  },

  phases: {
    menstrual: {
      name: "Menstrual",
      mood: "Sensitive · Tired · Variable",
      tips: [
        "Prepare a hot water bottle",
        "Check the stock of menstrual products",
        "Offer a pain reliever if she usually takes one",
        "Be gentle and patient",
        "Plan for comfort and calm",
      ],
      avoid: [
        "Downplaying her pain",
        "Planning something heavy without asking her first",
        "Making remarks about her mood",
      ],
    },
    follicular: {
      name: "Follicular",
      mood: "Energetic · Creative · Sociable",
      tips: [
        "Plan activities together",
        "Often a good time for meaningful conversations",
        "Support her projects",
        "Enjoy the often higher energy level",
      ],
      avoid: [
        "Don't assume — just ask her how she's feeling",
      ],
    },
    ovulatory: {
      name: "Ovulation",
      mood: "Confident · Radiant · Communicative",
      tips: [
        "Suggest a nice moment together",
        "Be attentive and appreciative",
        "Good time to talk if she feels like it",
        "Enjoy the natural closeness",
      ],
      avoid: ["Don't assume everything is always easy"],
    },
    luteal: {
      name: "Luteal",
      mood: "Variable · Sensitive · Tired",
      tips: [
        "Listen without trying to fix everything",
        "Lighten her mental load if possible",
        "Suggest gentle activities",
        "Anticipate her need for comfort",
        "Stay patient",
      ],
      avoid: [
        "\"That's just your PMS talking\"",
        "Avoidable conflicts",
        "Unnecessary social pressure",
      ],
    },
  },
};

export default en;
