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
