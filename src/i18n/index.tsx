import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { Lang, dictionaries } from './strings';

const STORAGE_KEY = 'setwise.lang';

function detectDeviceLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode?.toLowerCase();
    return code === 'tr' ? 'tr' : 'en';
  } catch {
    return 'en';
  }
}

type Params = Record<string, string | number>;

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => (key in params ? String(params[key]) : `{${key}}`));
}

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a leaf string key with optional {param} interpolation. */
  t: (key: string, params?: Params) => string;
  /** Read an array-valued key (e.g. calendar month/weekday lists). */
  tArr: (key: string) => string[];
  /** Locale string for Date#toLocaleDateString etc. */
  dateLocale: string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectDeviceLang);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'en' || saved === 'tr') setLangState(saved);
    });
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[lang];
    return {
      lang,
      setLang,
      t: (key, params) => {
        const entry = dict[key];
        if (typeof entry === 'string') return interpolate(entry, params);
        return key; // missing or non-string key: surface the key to catch gaps
      },
      tArr: (key) => {
        const entry = dict[key];
        return Array.isArray(entry) ? entry : [];
      },
      dateLocale: lang === 'tr' ? 'tr-TR' : 'en-US',
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
