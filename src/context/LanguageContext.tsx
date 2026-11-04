
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Language = "en" | "bn";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (english: string, bangla: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("namaz-language");

    if (savedLanguage === "bn" || savedLanguage === "en") {
      setLanguageState(savedLanguage);
    }

    setLoaded(true);
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("namaz-language", newLanguage);
  };

  const t = (english: string, bangla: string) => {
    return language === "bn" ? bangla : english;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
