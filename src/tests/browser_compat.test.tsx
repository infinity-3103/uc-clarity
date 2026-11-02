import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { playNotificationSound } from '../utils/sound';
import { isSpeechSupported, getAvailableVoices, speakText, stopSpeech } from '../utils/speech';
import { ErrorBoundary } from '../components/ErrorBoundary';

describe('Cross-Browser Compatibility Utilities (Safari & Chrome)', () => {
  describe('Web Audio (sound.ts)', () => {
    it('playNotificationSound executes without throwing when AudioContext is missing', () => {
      const origAudioContext = window.AudioContext;
      // @ts-expect-error test override
      delete window.AudioContext;

      expect(() => playNotificationSound()).not.toThrow();

      window.AudioContext = origAudioContext;
    });

    it('resumes suspended AudioContext safely without throwing', () => {
      const resumeMock = vi.fn().mockReturnValue(Promise.resolve());
      const mockAudioCtx = vi.fn().mockImplementation(() => ({
        state: 'suspended',
        resume: resumeMock,
        currentTime: 0,
        createOscillator: () => ({
          type: 'sine',
          frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        }),
        createGain: () => ({
          gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
        }),
        destination: {},
      }));

      // Assign mock AudioContext
      (window as any).AudioContext = mockAudioCtx;

      expect(() => playNotificationSound()).not.toThrow();
    });
  });

  describe('Speech Synthesis (speech.ts)', () => {
    beforeEach(() => {
      // Mock window.speechSynthesis
      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          getVoices: vi.fn().mockReturnValue([
            { name: 'Google Hindi', lang: 'hi-IN', default: false },
            { name: 'Google English', lang: 'en-IN', default: true },
          ]),
          speak: vi.fn(),
          cancel: vi.fn(),
          onvoiceschanged: null,
        },
        writable: true,
        configurable: true,
      });
    });

    it('detects speech support and lists available voices', () => {
      expect(isSpeechSupported()).toBe(true);
      const voices = getAvailableVoices();
      expect(voices.length).toBeGreaterThan(0);
    });

    it('speakText dispatches utterance with language locale', () => {
      speakText('नमस्ते', 'hi');
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('stopSpeech cancels any speech cleanly', () => {
      stopSpeech();
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    });
  });

  describe('ErrorBoundary Component', () => {
    // Suppress console.error during expected throw test
    const originalConsoleError = console.error;
    beforeEach(() => {
      console.error = vi.fn();
    });
    afterEach(() => {
      console.error = originalConsoleError;
    });

    const ProblemChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Simulated render error');
      }
      return <div>Normal Content</div>;
    };

    it('renders child component normally when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ProblemChild shouldThrow={false} />
        </ErrorBoundary>
      );
      expect(screen.getByText('Normal Content')).toBeInTheDocument();
    });

    it('catches render error, displays localized fallback UI, and provides reset button', () => {
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
        configurable: true,
      });

      render(
        <ErrorBoundary>
          <ProblemChild shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify friendly fallback UI is displayed
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText('An unexpected application error occurred. You can reset the demo state to recover.')
      ).toBeInTheDocument();

      // Reset button is present
      const resetBtn = screen.getByRole('button', { name: /Reset Demo/i });
      expect(resetBtn).toBeInTheDocument();

      fireEvent.click(resetBtn);
      expect(reloadMock).toHaveBeenCalled();
    });
  });
});
