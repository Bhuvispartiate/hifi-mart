// Custom notification sounds for delivery partner alerts
// Audio files are generated using Web Audio API for cross-platform compatibility

export interface NotificationSoundOptions {
  volume?: number; // 0-1
  loop?: boolean;
  duration?: number; // seconds
}

// Audio context singleton
let audioContext: AudioContext | null = null;
let currentOscillator: OscillatorNode | null = null;
let currentGain: GainNode | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Stop any currently playing sound
export const stopNotificationSound = (): void => {
  if (currentOscillator) {
    try {
      currentOscillator.stop();
      currentOscillator.disconnect();
    } catch (e) {
      // Already stopped
    }
    currentOscillator = null;
  }
  if (currentGain) {
    currentGain.disconnect();
    currentGain = null;
  }
};

// Play Zepto-like order alert sound (distinctive two-tone alert)
export const playOrderAlertSound = (options: NotificationSoundOptions = {}): void => {
  const { volume = 0.8, loop = false, duration = 3 } = options;
  
  stopNotificationSound();
  
  const ctx = getAudioContext();
  
  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.value = volume;
  currentGain = masterGain;

  const now = ctx.currentTime;
  const patternDuration = 0.6; // Duration of one alert pattern
  const repetitions = loop ? Math.ceil(duration / patternDuration) : 5;

  for (let i = 0; i < repetitions; i++) {
    const startTime = now + i * patternDuration;
    
    // High tone (attention grabbing)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 880; // A5
    gain1.gain.setValueAtTime(0, startTime);
    gain1.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
    gain1.gain.linearRampToValueAtTime(0, startTime + 0.15);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(startTime);
    osc1.stop(startTime + 0.2);

    // Low tone (distinctive pattern)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 587; // D5
    gain2.gain.setValueAtTime(0, startTime + 0.2);
    gain2.gain.linearRampToValueAtTime(0.5, startTime + 0.25);
    gain2.gain.linearRampToValueAtTime(0, startTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(startTime + 0.2);
    osc2.stop(startTime + 0.45);
  }
};

// Play success/confirmation sound
export const playSuccessSound = (options: NotificationSoundOptions = {}): void => {
  const { volume = 0.6 } = options;
  
  stopNotificationSound();
  
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.value = volume;
  currentGain = masterGain;

  const now = ctx.currentTime;

  // Rising two-tone for success
  const frequencies = [523, 659, 784]; // C5, E5, G5 (C major chord ascending)
  
  frequencies.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const startTime = now + index * 0.1;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, startTime + 0.25);
    
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
  });
};

// Play delivery update sound
export const playDeliveryUpdateSound = (options: NotificationSoundOptions = {}): void => {
  const { volume = 0.5 } = options;
  
  stopNotificationSound();
  
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.value = volume;
  currentGain = masterGain;

  const now = ctx.currentTime;

  // Soft notification ding
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 1047; // C6
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.6);
};

// Play urgent/critical alert sound (for missed orders, etc.)
export const playUrgentAlertSound = (options: NotificationSoundOptions = {}): void => {
  const { volume = 1, duration = 5 } = options;
  
  stopNotificationSound();
  
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.value = volume;
  currentGain = masterGain;

  const now = ctx.currentTime;
  const patternDuration = 0.4;
  const repetitions = Math.ceil(duration / patternDuration);

  for (let i = 0; i < repetitions; i++) {
    const startTime = now + i * patternDuration;
    
    // Alternating high-low alarm pattern
    const freq = i % 2 === 0 ? 1000 : 800;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.15);
    gain.gain.linearRampToValueAtTime(0, startTime + 0.2);
    
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + 0.25);
  }
};

// Play ringtone for incoming order (continuous until stopped)
export const playOrderRingtone = (options: NotificationSoundOptions = {}): void => {
  const { volume = 0.9 } = options;
  
  stopNotificationSound();
  
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.value = volume;
  currentGain = masterGain;

  const now = ctx.currentTime;
  const duration = 30; // Maximum 30 seconds
  const patternDuration = 1.2;
  const repetitions = Math.ceil(duration / patternDuration);

  // Zepto-like distinctive ringtone pattern
  for (let i = 0; i < repetitions; i++) {
    const patternStart = now + i * patternDuration;
    
    // First beep cluster (3 quick beeps)
    for (let j = 0; j < 3; j++) {
      const beepStart = patternStart + j * 0.15;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 932; // Bb5
      
      gain.gain.setValueAtTime(0, beepStart);
      gain.gain.linearRampToValueAtTime(0.5, beepStart + 0.02);
      gain.gain.linearRampToValueAtTime(0, beepStart + 0.1);
      
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(beepStart);
      osc.stop(beepStart + 0.12);
    }
    
    // Long confirmation beep
    const longBeepStart = patternStart + 0.5;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 698; // F5
    
    gain2.gain.setValueAtTime(0, longBeepStart);
    gain2.gain.linearRampToValueAtTime(0.4, longBeepStart + 0.02);
    gain2.gain.linearRampToValueAtTime(0.4, longBeepStart + 0.3);
    gain2.gain.linearRampToValueAtTime(0, longBeepStart + 0.4);
    
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(longBeepStart);
    osc2.stop(longBeepStart + 0.45);
  }
};
