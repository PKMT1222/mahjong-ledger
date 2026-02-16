'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Language, t as translate } from '@/lib/i18n';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const defaultContext: LanguageContextType = {
  lang: 'zh',
  setLang: () => {},
  t: (key: string) => key,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('zh');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('mahjong-lang') as Language;
    if (saved && (saved === 'zh' || saved === 'en')) {
      setLangState(saved);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('mahjong-lang', lang);
    }
  }, [lang, mounted]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const t = (key: string) => translate(key, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context;
}
