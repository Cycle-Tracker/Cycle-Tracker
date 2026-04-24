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

    // Onboarding choice (solo vs couple)
    choiceTitle: "Comment veux-tu utiliser l'app ?",
    choiceSubtitle:
      "Tu peux l'utiliser seul, ou la partager avec elle pour rester synchronisés.",
    choiceCreateTitle: "Créer un cycle partagé",
    choiceCreateDesc:
      "Tu obtiendras un code à partager avec ta partenaire. Vous verrez les mêmes infos en temps réel.",
    choiceJoinTitle: "Rejoindre avec un code",
    choiceJoinDesc:
      "Entre le code que ta partenaire t'a donné pour voir son cycle.",
    choiceSoloTitle: "Utiliser en solo",
    choiceSoloDesc:
      "Les données restent sur ton appareil. Tu peux activer le partage plus tard.",

    // Join cycle screen
    joinTitle: "Rejoindre un cycle",
    joinSubtitle: "Entre le code de partage (ex. ROSE-4872).",
    joinPlaceholder: "ROSE-4872",
    joinButton: "Rejoindre",
    joinBack: "← Retour",
    joinErrorInvalid: "Code invalide. Format attendu : MOT-1234.",
    joinErrorNotFound: "Aucun cycle trouvé avec ce code.",
    joinErrorNetwork: "Problème de connexion. Réessaie dans un instant.",
    joinLoading: "Connexion...",

    // Create shared
    createLoading: "Création du cycle partagé...",
    createError: "Impossible de créer le cycle partagé. Réessaie.",

    // Share section in settings
    shareSectionLabel: "Partage",
    shareActiveLabel: "Cycle partagé actif",
    shareCodeLabel: "Code à partager",
    shareCopyButton: "Copier",
    shareCopiedLabel: "Copié ✓",
    shareHelp:
      "Partage ce code avec elle. Elle pourra l'entrer dans l'app pour voir et modifier le cycle.",
    shareDisconnectButton: "Se déconnecter du cycle partagé",
    shareDisconnectConfirm:
      "Se déconnecter du cycle partagé ? Les données resteront sur Supabase et accessibles via le code.",
    shareEnableButton: "Activer le partage",
    shareEnableHelp:
      "Crée un code pour partager ce cycle avec ta partenaire.",
    shareOfflineLabel: "Mode hors-ligne — le partage n'est pas disponible.",
    syncIndicatorSynced: "Synchronisé",
    syncIndicatorOffline: "Hors-ligne",
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
