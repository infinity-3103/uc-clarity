import { useStore } from '../store/useStore';
import { Language } from '../domain/types';
import { en, TranslationKey } from './en';
import { hi } from './hi';
import { mr } from './mr';
import { kn } from './kn';

export * from './formatters';

const dictionaries: Record<Language, Record<string, string>> = {
  en: en as Record<string, string>,
  hi: hi as Record<string, string>,
  mr: mr as Record<string, string>,
  kn: kn as Record<string, string>,
};

export const LANGUAGE_OPTIONS: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हिं' },
  { code: 'mr', label: 'मरा' },
  { code: 'kn', label: 'ಕನ್ನ' },
];

/**
 * Returns Tailwind font family class appropriate for the selected script.
 */
export function getLanguageFontClass(lang: Language): string {
  if (lang === 'hi' || lang === 'mr') {
    return 'font-devanagari';
  }
  if (lang === 'kn') {
    return 'font-kannada';
  }
  return '';
}

export interface FallbackEvent {
  key: string;
  lang?: Language;
  language?: Language;
}

export const fallbackEvents: FallbackEvent[] = [];
export const fallbackLog: Array<{ key: string; language: Language }> = [];

export function clearFallbackEvents(): void {
  fallbackEvents.length = 0;
  fallbackLog.length = 0;
}

export function getFallbackEvents(): FallbackEvent[] {
  return [...fallbackEvents];
}

/**
 * Lightweight translation hook with parameter interpolation and fallback monitoring.
 */
export function useT() {
  const currentLanguage = useStore((state) => state.currentLanguage) || 'en';
  const setLanguage = useStore((state) => state.setLanguage);

  const t = (
    key: string,
    params?: Record<string, string | number>,
    fallback?: string
  ): string => {
    if (!key) return '';

    const dict = dictionaries[currentLanguage] || (en as Record<string, string>);
    let text = dict[key];

    if (text === undefined || text === null || text === '') {
      if (currentLanguage !== 'en') {
        console.error(`[i18n fallback] Key "${key}" missing in language "${currentLanguage}"`);
        fallbackEvents.push({ key, lang: currentLanguage, language: currentLanguage });
        fallbackLog.push({ key, language: currentLanguage });
      }
      text = (en as Record<string, string>)[key] !== undefined
        ? (en as Record<string, string>)[key]
        : fallback !== undefined
        ? fallback
        : key;
    }

    if (params && typeof text === 'string') {
      Object.entries(params).forEach(([pKey, pVal]) => {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      });
    }

    return text;
  };

  return {
    t,
    currentLanguage,
    setLanguage,
    fontClass: getLanguageFontClass(currentLanguage),
  };
}

export { en, hi, mr, kn };
export type { TranslationKey };
