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
    settingsCloseAria: "Fermer les réglages",
    settingsTitle: "Réglages",
    settingsSectionLabel: "Réglages",
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
    tabFood: "Aliments",
    tabAll: "Toutes les phases",
    canDoTitle: "Ce que tu peux faire",
    avoidTitle: "À éviter",
    nowBadge: "• maintenant",
    logPeriodButton: "Les règles ont commencé aujourd'hui",
    logPeriodConfirm:
      "Marquer aujourd'hui comme premier jour du cycle ? (la date de début sera mise à jour)",
    footerLine1: "Chaque personne est différente.",
    footerLine2:
      "Le plus fiable reste toujours de lui demander ce dont elle a besoin.",
    languageLabel: "Langue",

    // ===== Multi-step onboarding =====
    stepPrev: "← Précédent",
    stepNext: "Suivant →",
    stepFinish: "Terminer",
    stepSkip: "Passer",
    stepProgress: (current, total) => `${current} / ${total}`,

    // Step: language
    stepLangTitle: "Choisis ta langue",
    stepLangSubtitle: "Tu pourras la changer plus tard.",

    // Step: name
    stepNameTitle: "Comment tu t'appelles ?",
    stepNameSubtitle: "Ton prénom ne sert qu'à personnaliser l'app.",
    stepNamePlaceholder: "Ton prénom",

    // Step: role
    stepRoleTitle: "Tu es...",
    stepRoleSubtitle: "L'app s'adapte selon que tu vis le cycle ou que tu soutiens.",
    roleWoman: "Celle qui vit le cycle",
    roleWomanDesc: "Tu veux mieux comprendre ton corps et anticiper.",
    roleMan: "Le partenaire",
    roleManDesc: "Tu veux mieux la comprendre et l'accompagner.",

    // Step: questionnaire intro
    stepQuestTitle: "Quelques questions sur toi",
    stepQuestSubtitle:
      "Tes réponses aident à personnaliser les conseils qu'il verra. Tu peux passer cette étape.",

    // Step: partner choice
    stepShareTitle: "Partager avec ton partenaire ?",
    stepShareSubtitle:
      "Vous aurez la même info en temps réel sur vos deux téléphones.",

    // Step: cycle dates (woman)
    stepCycleTitle: "Ton dernier cycle",
    stepCycleSubtitle:
      "Quand ont commencé tes dernières règles ? Tu pourras ajuster les durées.",

    // Step: cycle dates (man, about his partner)
    stepCycleTitleMan: "Le cycle de ta partenaire",
    stepCycleSubtitleMan:
      "Quand ont commencé ses dernières règles ? Vous pourrez ajuster les durées ensemble.",

    // Step: join
    stepJoinTitle: "Rejoindre un cycle",
    stepJoinSubtitle:
      "Entre le code que ton/ta partenaire t'a donné (ex. ROSE-4872).",

    // Onboarding choice (solo vs couple)
    choiceTitle: "Comment veux-tu utiliser l'app ?",
    choiceSubtitle:
      "Tu peux l'utiliser seul·e, ou la partager avec l'autre pour rester synchronisés.",
    choiceCreateTitle: "Créer un cycle partagé",
    choiceCreateDesc:
      "Tu obtiendras un code à lui partager. Vous verrez les mêmes infos en temps réel.",
    choiceJoinTitle: "Rejoindre avec un code",
    choiceJoinDesc:
      "Entre le code que ton/ta partenaire t'a donné pour voir le cycle.",
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
    shareSMSButton: "Envoyer par SMS",
    shareSMSBody: (code) =>
      `Salut ! Voici mon code Cycle Tracker : ${code}\nOuvre l'app et entre ce code pour suivre mon cycle avec moi 💖`,
    shareHelp:
      "Partage ce code avec l'autre. Il·elle pourra l'entrer dans l'app pour voir et modifier le cycle.",
    shareDisconnectButton: "Se déconnecter du cycle partagé",
    shareDisconnectTitle: "Se déconnecter ?",
    shareDisconnectMsg: (name) =>
      name
        ? `Tu es sûr·e de vouloir te déconnecter de ${name} ? 🥺`
        : "Tu es sûr·e de vouloir te déconnecter du cycle partagé ? 🥺",
    shareDisconnectHelp:
      "Les données resteront sur Supabase. Tu pourras revenir avec le même code.",
    shareDisconnectConfirm: "Oui, me déconnecter",
    shareDisconnectCancel: "Annuler",
    shareEnableButton: "Activer le partage",
    shareEnableHelp: "Crée un code pour partager ce cycle.",
    shareJoinButton: "Rejoindre un code existant",
    shareJoinHelp: "Tu as déjà un code ? Connecte-toi dessus.",
    shareOfflineLabel: "Mode hors-ligne — le partage n'est pas disponible.",
    syncIndicatorSynced: "Synchronisé",
    syncIndicatorOffline: "Hors-ligne",

    // Names
    myNameLabel: "Ton prénom",
    partnerNameLabel: "Prénom du/de la partenaire",
    yourNameHint: "(facultatif)",

    // Questionnaire management
    questEditTitle: "Tes préférences",
    questEditSubtitle:
      "Tes réponses personnalisent ce que voit ton/ta partenaire.",
    questEditButton: "Modifier mes réponses",
    questSavedLabel: "Préférences enregistrées ✓",

    // Role in settings
    roleSectionLabel: "Ton rôle",

    // Woman dashboard extras
    womanPeriodInLabel: "Prochaines règles",
    womanPeriodTodayLabel: "Tes règles ont commencé",
    womanCyclePhaseLabel: "Tu es en phase",
    womanAnticipateTitle: "À anticiper",
    womanAnticipateMenstrual: "Les règles approchent. Prépare ton confort.",
    womanAnticipateOvulatory:
      "Tu es au pic d'énergie. Profite pour ce qui compte.",
    womanAnticipateLuteal:
      "Ton corps se prépare aux règles. La fatigue peut arriver.",
    womanAnticipateFollicular:
      "L'énergie revient. C'est ton moment créatif.",
    womanBadgeSolo: "Solo",
    womanSelfCareTitle: "Pour prendre soin de toi",
    womanSelfAvoidTitle: "À éviter pour toi",
    womanFoodTitle: "Côté assiette : à privilégier",
    womanFoodAvoidTitle: "Côté assiette : à limiter",

    // Man dashboard extras
    manHelloLabel: (name) => (name ? `Salut ${name}` : "Salut"),
    manCurrentlyLabel: (partnerName) =>
      partnerName ? `${partnerName} est en phase` : "Elle est en phase",
    manWhatToDoTitle: "Ce que tu peux faire pour elle",
    manWhatToAvoidTitle: "À éviter en ce moment",
    manFoodTitle: "Ce qui lui ferait du bien à manger",
    manFoodAvoidTitle: "Ce qui lui irait moins bien",
    manMoodLabel: "Son humeur probable",
    manPartnerMissingName: "ta partenaire",
    manTabNow: "Maintenant",
    manTabAll: "Toutes les phases",
    manPeriodInLabel: "Prochaines règles",
    manPeriodTodayLabel: "Ses règles ont commencé",
    manTraverseTitle: "Ce qu'elle traverse",
    manTraverseMenstrual:
      "Elle peut se sentir vidée, plus sensible et avoir mal physiquement. Sa fatigue n'est pas une humeur, c'est biologique.",
    manTraverseFollicular:
      "Son énergie revient progressivement. Sa motivation, sa concentration et sa créativité sont en hausse.",
    manTraverseOvulatory:
      "C'est son pic — confiante, sociale, à l'aise dans son corps. Beaucoup d'énergie disponible.",
    manTraverseLuteal:
      "Sa patience peut s'effriter, ses émotions s'amplifier (irritation, larmes faciles). Ce n'est pas dirigé contre toi.",

    // ----- Auth (login / signup) -----
    authTitle: "Bienvenue sur Cycle Tracker",
    authSubtitle: "Crée un compte pour retrouver ton cycle facilement.",
    authTabSignIn: "Connexion",
    authTabSignUp: "Inscription",
    authEmailLabel: "Email",
    authEmailPlaceholder: "ton@email.com",
    authPasswordLabel: "Mot de passe",
    authPasswordPlaceholder: "Au moins 6 caractères",
    authSignInButton: "Se connecter",
    authSignUpButton: "Créer mon compte",
    authLoading: "Patiente...",
    authSkipButton: "Continuer sans compte",
    authSwitchToSignUp: "Pas encore de compte ? Inscris-toi",
    authSwitchToSignIn: "Tu as déjà un compte ? Connecte-toi",
    authErrorInvalidCredentials: "Email ou mot de passe incorrect.",
    authErrorEmailExists: "Un compte existe déjà avec cet email.",
    authErrorWeakPassword: "Mot de passe trop court (6 caractères minimum).",
    authErrorInvalidEmail: "Email invalide.",
    authErrorNetwork: "Erreur réseau. Réessaye dans un instant.",
    authErrorGeneric: "Quelque chose s'est mal passé.",
    accountSectionLabel: "Mon compte",
    accountEmailLabel: "Connecté en tant que",
    accountSignOutButton: "Se déconnecter",
    accountSignedOutLabel: "Tu n'es pas connecté",
    accountSignInButton: "Me connecter",
    accountDeleteButton: "🗑️ Supprimer mon compte",
    accountDeleteConfirm1:
      "Supprimer définitivement ton compte ? Ton cycle restera accessible à ton/ta partenaire, mais ton accès sera supprimé.",
    accountDeleteConfirm2: "Vraiment ? Cette action est irréversible.",
    accountDeleteError: "La suppression a échoué.",

    // Phase info popup
    phaseInfoAria: "En savoir plus sur cette phase",
    phaseInfoTitle: "À propos de cette phase",
    phaseInfoClose: "Fermer",

    // Questionnaire re-edit from settings
    questReEditOpen: "Modifier mes réponses",
    questReEditSave: "Enregistrer",
    questReEditReset: "Tout effacer",

    // Redo full onboarding flow (role pick, name, dates, partner choice)
    redoOnboardingSectionLabel: "Changer mon rôle ou mes infos",
    redoOnboardingHelp:
      "Permet de redire si tu es la personne qui a le cycle 👩 ou son/sa partenaire 👨, de changer ton prénom, tes dates ou de rejoindre un autre code.",
    redoOnboardingButton: "🔄 Refaire le démarrage",
    redoOnboardingConfirm:
      "Reprendre le démarrage depuis le début ? Tes informations actuelles seront remplacées par tes nouvelles réponses.",

    // Bottom navigation tabs
    tabHome: "Accueil",
    tabCalendar: "Calendrier",
    tabJournal: "Journal",
    tabHistory: "Historique",
    tabSettings: "Réglages",

    // Placeholder pages
    comingSoonTitle: "Bientôt disponible",
    comingSoonBody:
      "Cette page arrive très vite. On y travaille avec amour 💖",
    calendarPageHelp:
      "Vois tes règles passées, l'ovulation et les jours fertiles. La fenêtre de fertilité s'affichera ici.",
    journalPageHelp:
      "Notez vos humeurs, douleurs ou petits mots ici. Tout est partagé entre toi et ton/ta partenaire.",
    historyPageHelp:
      "Cycles passés, durée moyenne et tendances de ton corps mois après mois.",

    // Notifications bell on home
    notifsAria: "Notifications",
    notifsTitle: "Notifications",
    notifsEmpty: "Aucune notification pour le moment",
    notifsClose: "Fermer",
    partnerFallback: "ta partenaire",

    // OS notifications (Settings)
    notifsSettingsLabel: "Notifications du téléphone",
    notifsSettingsHelp:
      "Reçois une notification quand les règles approchent ou pendant la fenêtre fertile.",
    notifsToggleOn: "Activées",
    notifsToggleOff: "Activer les notifications",
    notifsBlocked:
      "Les notifications sont bloquées. Active-les dans les réglages de ton navigateur.",
    notifsUnsupported:
      "Ton navigateur ne supporte pas les notifications.",
    notifsTest: "Envoyer une notification de test",
    notifsTestSent: "Notification envoyée ✓",
    notifsTestFail: "Impossible d'envoyer la notification.",
    notifTestTitle: "Test ✨",
    notifTestBody: "Si tu vois ceci, les notifs sont bien actives.",

    // Auto-prompt banner (Home)
    notifPromptTitle: "Activer les notifications ?",
    notifPromptHelp:
      "Reçois un rappel doux avant les règles et pendant la fenêtre fertile.",
    notifPromptButton: "Activer",
    notifPromptBusy: "...",
    notifPromptClose: "Fermer",

    // Notification messages (computed from cycle state)
    notifPeriodTodayTitle: "Premier jour des règles 🩸",
    notifPeriodTodayBodyWoman:
      "Sois douce avec toi aujourd'hui. Repos, chaleur, et tout ce qui te fait du bien.",
    notifPeriodTodayBodyMan: (name) =>
      `${name} commence ses règles aujourd'hui. Une attention, un thé chaud, un câlin — tout est bienvenu.`,

    notifOvulationTodayTitle: "Pic d'ovulation aujourd'hui 🌕",
    notifOvulationTodayBodyWoman:
      "Tu es au sommet de ton énergie. Confiance, magnétisme, créativité.",
    notifOvulationTodayBodyMan: (name) =>
      `${name} est en plein pic — sociable, énergique, communicative. Profite de ce moment ensemble.`,

    notifOvulationTomorrowTitle: "Ovulation demain",
    notifOvulationTomorrowBody:
      "Le pic arrive — pic de libido, de confiance et d'énergie sociale.",

    notifFertileTitle: "Fenêtre fertile",
    notifFertileBody:
      "Période fertile en cours. À garder en tête si vous essayez ou évitez de concevoir.",

    notifPeriodTomorrowTitle: "Règles demain",
    notifPeriodInNTitle: (n) => `Règles dans ${n} jours`,
    notifPeriodSoonBodyWoman:
      "Phase prémenstruelle. Si tu sens des tensions, c'est normal — ralentis ce que tu peux.",
    notifPeriodSoonBodyMan: (name) =>
      `Les règles de ${name} approchent. Patience et douceur sont des super-pouvoirs.`,

    notifCalmTitle: "Tout est calme ✨",
    notifCalmBody: (name) =>
      name
        ? `Rien de spécial à signaler aujourd'hui, ${name}.`
        : "Rien de spécial à signaler aujourd'hui.",

    // Calendar
    calendarPrevAria: "Mois précédent",
    calendarNextAria: "Mois suivant",
    calendarToday: "Aujourd'hui",
    calendarKind_period: "Règles",
    calendarKind_ovulation: "Ovulation",
    calendarKind_fertile: "Période fertile",
    calendarPredictedPeriod: "Règles prévues",
    calendarPastPeriod: "Règles (jour passé)",
    calendarOvulationDay: "Jour d'ovulation prévu",
    calendarFertileDay: "Jour de la fenêtre fertile",
    calendarMarkPeriodStart: "Marquer comme premier jour des règles",
    calendarMarkConfirm:
      "Marquer ce jour comme le premier jour de tes règles ? La date de cycle sera mise à jour.",

    // Journal
    journalAdd: "Ajouter une entrée",
    journalAddTitle: "Nouvelle entrée",
    journalEditTitle: "Modifier l'entrée",
    journalEdit: "Modifier",
    journalDelete: "Supprimer",
    journalDeleteConfirm: "Supprimer cette entrée ?",
    journalDateLabel: "Date",
    journalMoodLabel: "Humeur",
    journalEnergyLabel: "Énergie",
    journalNoteLabel: "Note",
    journalNotePlaceholder:
      "Comment tu te sens, ce qui s'est passé, un mot pour ton/ta partenaire…",
    journalAuthorMe: "Moi",
    journalEmptyTitle: "Pas encore d'entrée",
    journalEmptyBody:
      "Ajoute ta première note pour partager avec ton/ta partenaire.",
    journalMood_happy: "Joyeuse",
    journalMood_calm: "Calme",
    journalMood_tired: "Fatiguée",
    journalMood_sad: "Triste",
    journalMood_stressed: "Stressée",
    journalMood_love: "Amoureuse",

    // History
    historyTotalCycles: "Cycles enregistrés",
    historyAvgLength: "Cycle moyen",
    historyAvgPeriod: "Règles moyennes",
    historyPastCycles: "Cycles passés",
    historyPredictions: "Prochaines règles prévues",
    historyNoDataTitle: "Pas encore d'historique",
    historyNoDataBody:
      "Marque tes règles à chaque cycle pour voir tes statistiques apparaître ici.",

    // Install banner (PWA install prompt)
    installPromptTitle: "Ajouter l'app à ton écran d'accueil",
    installPromptHelpAndroid:
      "Installe Cycle pour l'ouvrir comme une vraie app, en un tap.",
    installPromptHelpIOS:
      "Sur iPhone : appuie sur Partager ⬆️ puis « Sur l'écran d'accueil ».",
    installPromptButton: "Installer",
    installPromptClose: "Fermer",
  },

  questionnaire: {
    introTitle: "Quelques questions",
    introSubtitle:
      "Réponds en quelques secondes. Ça nous aide à adapter les conseils.",
    questionCounter: (current, total) => `Question ${current} sur ${total}`,
    finish: "Terminer le questionnaire",

    questions: {
      painIntensity: "Tes règles sont généralement...",
      periodTouch: "Pendant les règles, tu préfères...",
      emotionalPms:
        "Avant tes règles, tu te sens plus sensible ou irritable ?",
      physicalPms:
        "Avant tes règles, tu as des inconforts physiques (maux de tête, ballonnements, douleurs)?",
      tired: "Quand tu es fatiguée, tu préfères qu'il...",
      loveLanguage: "Ta façon préférée d'être soutenue",
      comfortFood: "Le sucré / confort food pendant les règles",
      lightExercise: "L'exercice léger pendant les règles",
    },

    options: {
      high: "Douloureuses",
      medium: "Modérées",
      low: "Légères",

      lots: "Beaucoup de câlins",
      space: "De l'espace",
      depends: "Ça dépend",

      often: "Souvent",
      sometimes: "Parfois",
      rarely: "Rarement",

      gentle: "Te propose des activités douces",
      alone: "Te laisse tranquille",
      ask: "Te demande directement",

      words: "Mots tendres",
      hugs: "Câlins",
      attention: "Petites attentions",
      // space reused

      helps: "Ça m'aide",
      weighs: "Ça me pèse",
      // depends reused

      good: "Ça me fait du bien",
      no: "Non merci",
      // depends reused
    },
  },

  phases: {
    menstrual: {
      name: "Règles",
      mood: "Sensible · Fatiguée · Variable",
      description:
        "Les règles : la muqueuse utérine se détache, provoquant des saignements. L'énergie est au plus bas, le corps a besoin de repos. Souvent accompagnées de crampes, fatigue, et hypersensibilité émotionnelle.",
      tips: [
        "Prépare une bouillotte",
        "Vérifie les stocks de produits menstruels",
        "Sois doux et patient",
        "Prévois du confort et du calme",
      ],
      extraTips: [
        { text: "Propose un antalgique (elle en prend souvent)", tags: ["painful-periods"] },
        { text: "Câlins et contact : elle aime être proche", tags: ["wants-affection-menstrual", "love-hugs"] },
        { text: "Laisse-lui de l'espace, elle préfère ça", tags: ["wants-space-menstrual", "love-space"] },
        { text: "Propose-lui son snack réconfort préféré", tags: ["food-helps"] },
        { text: "Mots doux pour lui rappeler que tu es là", tags: ["love-words"] },
        { text: "Petites attentions (plaid, lumière tamisée, tisane)", tags: ["love-attention"] },
        { text: "Une promenade douce si elle a envie de bouger", tags: ["exercise-helps"] },
      ],
      avoid: [
        "Minimiser sa douleur",
        "Planifier quelque chose de lourd sans lui demander",
        "Faire des remarques sur son humeur",
      ],
      selfCare: [
        "Repose-toi : ton corps a besoin de calme",
        "Hydrate-toi (eau, tisanes camomille ou framboisier)",
        "Bouillotte chaude sur le ventre pour les crampes",
        "Privilégie le fer (lentilles, épinards, viande rouge)",
        "Marche douce ou yoga si tu en as l'envie",
        "Annule sans culpabiliser ce qui demande trop d'énergie",
      ],
      selfAvoid: [
        "Caféine en excès — peut amplifier les crampes",
        "Alcool — accentue les sautes d'humeur, déshydrate",
        "Sport intense si tu n'es pas en forme",
        "Te juger pour ton manque d'énergie",
      ],
      food: {
        eat: [
          "Fer : viande rouge, lentilles, épinards, boudin (compense la perte de sang)",
          "Vitamine C avec le fer : orange, kiwi, poivron (booste l'absorption)",
          "Magnésium : chocolat noir 70%+, amandes, banane (apaise les crampes)",
          "Oméga-3 : saumon, sardines, graines de lin (anti-inflammatoire)",
          "Tisanes chaudes : framboisier, camomille, gingembre (anti-douleur naturel)",
          "Bouillons et soupes : faciles à digérer, réconfortants, hydratants",
        ],
        avoid: [
          "Café en excès — accentue les crampes et la déshydratation",
          "Alcool — déshydrate et amplifie l'inflammation",
          "Sucre raffiné — pic glycémique = chute d'énergie",
          "Aliments très salés — favorisent la rétention d'eau",
          "Plats ultra-transformés — pauvres en fer et magnésium",
        ],
      },
    },
    follicular: {
      name: "Folliculaire",
      mood: "Énergique · Créative · Sociable",
      description:
        "Phase folliculaire : les œstrogènes montent et préparent l'ovulation. L'énergie revient progressivement, l'humeur s'éclaircit, la motivation et la créativité sont au rendez-vous. C'est souvent le meilleur moment pour lancer des projets.",
      tips: [
        "Planifie des activités ensemble",
        "C'est souvent un bon moment pour échanger",
        "Soutiens ses projets",
        "Profite d'une énergie souvent plus haute",
      ],
      extraTips: [
        { text: "Propose une sortie sportive — elle peut apprécier", tags: ["exercise-helps"] },
        { text: "Laisse-la initier les plans — elle est dans son élan", tags: ["love-space"] },
      ],
      avoid: [
        "Éviter de présumer : demande-lui simplement comment elle se sent",
      ],
      selfCare: [
        "Profite de l'énergie qui revient",
        "Bon moment pour démarrer de nouveaux projets",
        "Sport plus intense possible (cardio, renforcement)",
        "Période propice à l'apprentissage et à la concentration",
        "Sociabilise — ton humeur s'éclaircit naturellement",
      ],
      selfAvoid: [
        "Te surcharger : l'énergie est là, ne la grille pas",
        "Ignorer la fatigue si elle apparaît malgré tout",
      ],
      food: {
        eat: [
          "Protéines maigres : œufs, poulet, tofu, poisson blanc (énergie stable)",
          "Légumes crucifères : brocoli, chou, roquette (régulent les œstrogènes)",
          "Céréales complètes : avoine, quinoa, riz brun (énergie longue durée)",
          "Fermentés : yaourt, kéfir, choucroute (pour le microbiote)",
          "Fruits frais et légumes verts : vitamines pour la nouvelle énergie",
          "Graines de courge et lin : zinc et lignanes pour l'équilibre hormonal",
        ],
        avoid: [
          "Excès de soja non fermenté — peut perturber l'équilibre œstrogénique",
          "Sodas et jus sucrés — pic glycémique évitable",
          "Repas trop lourds le soir — peuvent freiner la dynamique",
        ],
      },
    },
    ovulatory: {
      name: "Ovulation",
      mood: "Confiante · Rayonnante · Communicative",
      description:
        "Ovulation : l'ovaire libère un ovocyte. Pic d'œstrogènes et de testostérone. Énergie, libido, confiance en soi et sociabilité sont au maximum. Courte fenêtre de fertilité (~24-48h).",
      tips: [
        "Propose un moment sympa à deux",
        "Sois attentif et valorisant",
        "Bon moment pour discuter si elle en a envie",
        "Profite de la complicité naturelle",
      ],
      extraTips: [
        { text: "Dis-lui que tu la trouves belle", tags: ["love-words"] },
        { text: "Un vrai câlin long — elle en profitera", tags: ["love-hugs"] },
      ],
      avoid: ["Ne pars pas du principe que tout est toujours facile"],
      selfCare: [
        "Profite de la confiance et du rayonnement",
        "Bon moment pour les présentations, entretiens, conversations importantes",
        "Hydrate-toi bien : le corps perd plus d'eau",
        "Libido plus haute : c'est normal et sain",
        "Sociabilité au max — vois tes proches",
      ],
      selfAvoid: [
        "Décisions impulsives sous l'effet de la confiance",
        "Oublier la contraception si tu n'es pas en projet bébé (fertilité au max)",
        "Surplaning — ton énergie reste finie",
      ],
      food: {
        eat: [
          "Antioxydants : baies, grenade, myrtilles (protection cellulaire)",
          "Bonnes graisses : avocat, noix, huile d'olive (équilibre hormonal)",
          "Hydratation : eau, eau de coco, infusions (le corps perd plus d'eau)",
          "Légumes verts : kale, épinards, brocoli (fibres + folates)",
          "Poisson gras : saumon, maquereau (oméga-3 anti-inflammatoires)",
          "Fruits riches en vitamine C : kiwi, agrumes, fraises",
        ],
        avoid: [
          "Excès de sel — favorise les ballonnements",
          "Alcool — réduit la qualité de l'ovulation",
          "Trop de caféine — peut accentuer l'anxiété au pic d'œstrogènes",
        ],
      },
    },
    luteal: {
      name: "Phase lutéale",
      mood: "Variable · Sensible · Fatiguée",
      description:
        "Phase lutéale : la progestérone domine, l'énergie baisse. Le corps se prépare soit à accueillir une grossesse, soit à déclencher les règles. SPM possible : irritabilité, sensibilité, fatigue, fringales, ballonnements, maux de tête.",
      tips: [
        "Écoute sans chercher à tout régler",
        "Allège sa charge mentale si possible",
        "Anticipe ses besoins de confort",
        "Reste patient",
      ],
      extraTips: [
        { text: "Elle peut être émotive : accueille sans commenter", tags: ["emotional-pms"] },
        { text: "Maux de tête ? Propose doliprane + eau + pièce calme", tags: ["physical-pms"] },
        { text: "Propose une activité calme (film, cuisine, balade)", tags: ["offer-gentle-activities"] },
        { text: "Laisse-la souffler seule si elle préfère", tags: ["leave-her-alone-when-tired"] },
        { text: "Demande-lui simplement de quoi elle a envie", tags: ["ask-when-tired"] },
        { text: "Apporte-lui un petit plaisir sucré si elle aime", tags: ["food-helps"] },
      ],
      avoid: [
        "\"C'est ton SPM qui parle\"",
        "Les conflits évitables",
        "La pression sociale inutile",
      ],
      selfCare: [
        "Prends soin de toi : ton corps prépare beaucoup en silence",
        "Magnésium contre le SPM (chocolat noir, amandes, banane)",
        "Sommeil prioritaire — tu peux avoir besoin de plus dormir",
        "Activité douce : yoga, étirements, marche",
        "Note tes symptômes pour mieux te connaître",
        "Sois indulgente avec toi-même",
      ],
      selfAvoid: [
        "L'auto-critique : c'est l'hormone qui parle, pas toi",
        "Sucre raffiné en excès — amplifie les sautes d'humeur",
        "Conflits importants — reporte si possible",
        "Comparer ton humeur à celle du début de cycle",
      ],
      food: {
        eat: [
          "Magnésium : chocolat noir, amandes, cajou, banane (apaise le SPM)",
          "Glucides complexes : patate douce, riz complet, flocons d'avoine (anti-fringales)",
          "Vitamine B6 : pois chiches, dinde, banane (régule l'humeur)",
          "Calcium : yaourt, sardines, brocoli (atténue les douleurs SPM)",
          "Tryptophane : œufs, dinde, graines de courge (favorise la sérotonine)",
          "Tisanes apaisantes : camomille, mélisse, verveine",
        ],
        avoid: [
          "Sucre raffiné — amplifie l'irritabilité et les fringales",
          "Sel en excès — accentue les ballonnements",
          "Café après 14h — perturbe le sommeil déjà fragile",
          "Alcool — accentue la fatigue et les sautes d'humeur",
          "Aliments ultra-transformés — pauvres en magnésium et B6",
        ],
      },
    },
  },
};

export default fr;
