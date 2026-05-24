import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { translations, type TranslationKey } from "../lib/translations";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function applyLanguageToDOM(lang: Language) {
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('masroofy-language') as Language | null;
    return saved === 'en' ? 'en' : 'ar';
  });

  // Apply to DOM on mount and whenever language changes
  useEffect(() => {
    applyLanguageToDOM(language);
  }, [language]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('masroofy-language', lang);
    applyLanguageToDOM(lang);

    // Persist to Supabase in background
    if (user) {
      await supabase
        .from('profiles')
        .update({ language: lang })
        .eq('id', user.id);
    }
  };

  const t = (key: TranslationKey, vars?: Record<string, string | number>): string => {
    let str = translations[language][key] ?? translations['ar'][key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{{${k}}}`, String(v));
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}