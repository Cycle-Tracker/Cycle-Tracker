const fr = {
  code: "fr",
  label: "Français",
  short: "FR",
  flag: "🇫🇷",
  htmlLang: "fr",

  ui: {
    appTitle: "Cycle Tracker",
    appSubtitle: "Suivi élégant et discret du cycle",
    settingsOpenAria: "Ouvrir les réglages",
    settingsTitle: "Réglages",
    settingsSectionLabel: "Réglages des phases",
    totalCycleLabel: "Cycle total :",
    daysUnit: "jours",
    dayShort: "j",
    minSuffix: "j min",
    maxSuffix: "j max",
    startDateLabel: "Premier jour des dernières règles",
    resetButton: "Réinitialiser",
    currentPhaseLabel: "Phase actuelle",
    energyLabel: "Énergie",
    periodInPrefix: "Prochaine période estimée dans",
    periodInDays: (n) => `${n} ${n === 1 ? "jour" : "jours"}`,
    periodTodayLabel: "Règles en cours",
    tabTips: "Conseils",
    tabAll: "Toutes les phases",
    canDoTitle: "Ce que tu peux faire",
    avoidTitle: "À éviter",
    nowBadge: "• maintenant",
    logPeriodButton: "Les règles ont commencé aujourd'hui",
    logPeriodConfirm:
      "Marquer aujourd'hui comme premier jour du cycle ? (la date de début sera mise à jour)",
    footerLine1: "Chaque femme est différente.",
    footerLine2:
      "Le plus fiable reste toujours de lui demander ce dont elle a besoin.",
    languageLabel: "Langue",
    welcomeTitle: "Bienvenue",
    welcomeSubtitle: "Configurons le cycle avant de commencer.",
    welcomeLangStep: "1. Langue",
    welcomeDateStep: "2. Début du dernier cycle",
    welcomePhasesStep: "3. Durée des phases (optionnel)",
    welcomePhasesHelp:
      "Tu peux laisser les valeurs par défaut et ajuster plus tard.",
    welcomeStartButton: "Commencer",
  },

  phases: {
    menstrual: {
      name: "Règles",
      mood: "Sensible · Fatiguée · Variable",
      tips: [
        "Prépare une bouillotte",
        "Vérifie les stocks de produits menstruels",
        "Propose un antalgique si elle en prend habituellement",
        "Sois doux et patient",
        "Prévois du confort et du calme",
      ],
      avoid: [
        "Minimiser sa douleur",
        "Planifier quelque chose de lourd sans lui demander",
        "Faire des remarques sur son humeur",
      ],
    },
    follicular: {
      name: "Folliculaire",
      mood: "Énergique · Créative · Sociable",
      tips: [
        "Planifie des activités ensemble",
        "C'est souvent un bon moment pour échanger",
        "Soutiens ses projets",
        "Profite d'une énergie souvent plus haute",
      ],
      avoid: [
        "Éviter de présumer : demande-lui simplement comment elle se sent",
      ],
    },
    ovulatory: {
      name: "Ovulation",
      mood: "Confiante · Rayonnante · Communicative",
      tips: [
        "Propose un moment sympa à deux",
        "Sois attentif et valorisant",
        "Bon moment pour discuter si elle en a envie",
        "Profite de la complicité naturelle",
      ],
      avoid: ["Ne pars pas du principe que tout est toujours facile"],
    },
    luteal: {
      name: "Phase lutéale",
      mood: "Variable · Sensible · Fatiguée",
      tips: [
        "Écoute sans chercher à tout régler",
        "Allège sa charge mentale si possible",
        "Propose des activités douces",
        "Anticipe ses besoins de confort",
        "Reste patient",
      ],
      avoid: [
        "\"C'est ton SPM qui parle\"",
        "Les conflits évitables",
        "La pression sociale inutile",
      ],
    },
  },
};

export default fr;
