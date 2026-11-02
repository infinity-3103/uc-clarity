// Web Audio API notification sound generator
// Synthesizes a mobile push notification chime without requiring external audio assets.
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioContextClass();
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

export function playNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // In Chrome, AudioContext is suspended until a user gesture. Attempt resume cleanly.
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        // Fail silently without console error if browser policy blocks autoplay
      });
    }

    const now = ctx.currentTime;

    // Primary bell tone (Frequency ramps up from D5 ~587Hz to A5 ~880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.08);

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.45);

    // Harmonic sparkle tone (Starts at 880Hz, ramps to D6 ~1174Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880.0, now + 0.07);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.16);

    gain2.gain.setValueAtTime(0.2, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.07);
    osc2.stop(now + 0.55);
  } catch {
    // Fail silently without console error per cross-browser requirements
  }
}
