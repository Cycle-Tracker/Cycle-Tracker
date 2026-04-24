import { createContext, useContext, useEffect, useMemo, useState } from "react";
import fr from "./fr";
import en from "./en";
import ru from "./ru";

export const LOCALES = { fr, en, ru };
export const LOCALE_LIST = [fr, en, ru];

const STORAGE_KEY = "cycle-language";

function detectInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LOCALES[saved]) return saved;
  } catch {
    // ignore
  }

  if (typeof navigator !== "undefined") {
    const browser = (navigator.language || "").toLowerCase();
    if (browser.startsWith("ru")) return "ru";
    if (browser.startsWith("en")) return "en";
    if (browser.startsWith("fr")) return "fr";
  }

  return "fr";
}

const LanguageContext = createContext({
  lang: "fr",
  setLang: () => {},
  locale: fr,
  t: fr,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLanguage);

  const locale = LOCALES[lang] ?? fr;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale.htmlLang;
    }
  }, [lang, locale.htmlLang]);

  const value = useMemo(
    () => ({
      lang,
      setLang: (next) => {
        if (LOCALES[next]) setLangState(next);
      },
      locale,
      t: locale,
    }),
    [lang, locale]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
