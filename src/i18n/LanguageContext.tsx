import {createContext, useContext, useEffect, useState} from 'react';
import {type AppLanguage, TRANSLATIONS, type TranslationCatalog} from './translations.ts';

const STORAGE_LANGUAGE_KEY = 'lightrider_language_v1';

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: TranslationCatalog;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: TRANSLATIONS.en,
});

function loadStoredLanguage(): AppLanguage {
  try {
    const raw = localStorage.getItem(STORAGE_LANGUAGE_KEY);
    if (raw === 'pt-PT' || raw === 'en') {
      return raw;
    }
  } catch {
    // Ignore storage errors
  }
  return 'en';
}

export function LanguageProvider({children}: {children: React.ReactNode}) {
  const [language, setLanguageState] = useState<AppLanguage>(loadStoredLanguage);

  const setLanguage = (next: AppLanguage) => {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_LANGUAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = TRANSLATIONS[language].appTitle;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: TRANSLATIONS[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
