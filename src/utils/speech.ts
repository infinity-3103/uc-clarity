// Cross-browser speech synthesis utility for Chrome, Safari, and Firefox.
// Chrome loads voices asynchronously (via onvoiceschanged), while Safari populates synchronously.

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

function loadVoices(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      cachedVoices = list;
      voicesLoaded = true;
    }
  } catch {
    // Fail silently in restricted browser environments
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  try {
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };
  } catch {
    // Ignore environments where onvoiceschanged assignment is restricted
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!voicesLoaded) {
    loadVoices();
  }
  return cachedVoices;
}

export function stopSpeech(): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Fail silently
  }
}

export function speakText(text: string, lang: 'en' | 'hi' | 'mr' | 'kn' | string = 'en'): void {
  if (!isSpeechSupported() || !text) return;

  try {
    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(text);

    // Map language code to standard locale identifier
    const localeMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      mr: 'mr-IN',
      kn: 'kn-IN',
    };
    const targetLocale = localeMap[lang] || 'en-IN';
    utterance.lang = targetLocale;

    // Pick best matching voice if available
    const voices = getAvailableVoices();
    if (voices.length > 0) {
      const langPrefix = targetLocale.split('-')[0].toLowerCase();
      const matched = voices.find(
        (v) => v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)
      );
      if (matched) {
        utterance.voice = matched;
      }
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  } catch {
    // Fail gracefully without crashing
  }
}
