import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { locales } from "../constants/locales";

const LanguageContext = createContext({ lang: "es", t: locales["es"], changeLanguage: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("es"); // fallback
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("@fynx_lang").then(stored => {
      if (stored && locales[stored]) {
        setLang(stored);
      } else {
        const systemLang = Localization.getLocales()[0]?.languageCode;
        const defaultLang = systemLang && locales[systemLang] ? systemLang : "es";
        setLang(defaultLang);
      }
      setIsReady(true);
    }).catch(() => setIsReady(true));
  }, []);

  const changeLanguage = async (newLang) => {
    if (locales[newLang]) {
      setLang(newLang);
      await AsyncStorage.setItem("@fynx_lang", newLang);
    }
  };

  const t = locales[lang];

  if (!isReady) return null;

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
