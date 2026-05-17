import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { locales } from "../constants/locales";

const LanguageContext = createContext({ lang: "es", t: locales["es"], changeLanguage: () => {}, countryCode: "XX" });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("es");
  const [isReady, setIsReady] = useState(false);

  // Detectar país del dispositivo
  const locale = Localization.getLocales()[0];
  const countryCode = locale?.regionCode || locale?.languageTag?.split("-")[1] || "XX";

  useEffect(() => {
    AsyncStorage.getItem("@fynx_lang").then(stored => {
      if (stored && locales[stored]) {
        setLang(stored);
      } else {
        const systemLang = locale?.languageCode;
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
      
      try {
        const { updateFynxWidgetLocal } = require("../../widget-task");
        Promise.resolve(updateFynxWidgetLocal()).catch(() => {});
      } catch (e) {}
    }
  };

  const t = locales[lang];

  if (!isReady) return null;

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t, countryCode }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
