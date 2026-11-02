import { useStore } from '../store/useStore';
import { Language } from '../domain/types';
import { en, TranslationKey } from './en';
import { hi } from './hi';
import { mr } from './mr';
import { kn } from './kn';

export * from './formatters';

export function humanizeKey(key: string): string {
  if (!key) return '';
  let s = key.replace(/_label$/, '').replace(/^lbl_/, '').replace(/^status_/, '');
  s = s.replace(/[_-]+/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

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

export function translate(
  key: string,
  lang: Language = 'en',
  params?: Record<string, string | number>,
  fallback?: string
): string {
  if (!key) return '';

  const dict = dictionaries[lang] || (en as Record<string, string>);
  let text = dict[key];

  if (text === undefined || text === null || text === '') {
    if (lang !== 'en') {
      console.error(`[i18n fallback] Key "${key}" missing in language "${lang}"`);
      fallbackEvents.push({ key, lang, language: lang });
      fallbackLog.push({ key, language: lang });
    }
    const enVal = (en as Record<string, string>)[key];
    if (enVal !== undefined && enVal !== null && enVal !== '') {
      text = enVal;
    } else if (fallback !== undefined && fallback !== null && fallback !== '') {
      text = fallback;
    } else {
      const isDev = Boolean((import.meta as any).env?.DEV);
      if (isDev) {
        console.error(`[i18n missing] Key "${key}" missing in English dictionary. Falling back to humanized string.`);
      }
      text = humanizeKey(key);
    }
  }

  if (params && typeof text === 'string') {
    Object.entries(params).forEach(([pKey, pVal]) => {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    });
  }

  return text;
}

/**
 * Standalone translation function callable outside React component lifecycle.
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  fallback?: string
): string {
  const currentLanguage = (useStore.getState ? useStore.getState().currentLanguage : 'en') || 'en';
  return translate(key, currentLanguage, params, fallback);
}

/**
 * Lightweight translation hook with parameter interpolation and fallback monitoring.
 */
export function useT() {
  const currentLanguage = useStore((state) => state.currentLanguage) || 'en';
  const setLanguage = useStore((state) => state.setLanguage);

  const tHook = (
    key: string,
    params?: Record<string, string | number>,
    fallback?: string
  ): string => translate(key, currentLanguage, params, fallback);

  return {
    t: tHook,
    currentLanguage,
    setLanguage,
    fontClass: getLanguageFontClass(currentLanguage),
  };
}

export { en, hi, mr, kn };
export type { TranslationKey };
