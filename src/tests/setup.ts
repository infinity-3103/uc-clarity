import '@testing-library/jest-dom';

if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof (globalThis as any).SpeechSynthesisUtterance === 'undefined') {
  (globalThis as any).SpeechSynthesisUtterance = class MockSpeechSynthesisUtterance {
    text: string;
    lang: string = '';
    voice: unknown = null;
    rate: number = 1;
    pitch: number = 1;
    constructor(text: string = '') {
      this.text = text;
    }
  };
}
