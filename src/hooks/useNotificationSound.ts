import { useRef, useCallback, useEffect } from 'react';

// Generate a ringtone using Web Audio API
const createRingtone = (audioContext: AudioContext, duration: number = 3): AudioBuffer => {
  const sampleRate = audioContext.sampleRate;
  const totalSamples = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Create a repeating two-tone ringtone pattern
  const frequencies = [880, 698]; // A5 and F5 notes
  const ringDuration = 0.15; // Each ring duration
  const pauseDuration = 0.1; // Pause between rings
  const cycleDuration = (ringDuration * 2) + pauseDuration;
  
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const cyclePosition = t % cycleDuration;
    
    let amplitude = 0;
    let frequency = 0;
    
    if (cyclePosition < ringDuration) {
      // First tone
      frequency = frequencies[0];
      amplitude = 0.3;
    } else if (cyclePosition < ringDuration * 2) {
      // Second tone
      frequency = frequencies[1];
      amplitude = 0.3;
    }
    // Pause (amplitude stays 0)
    
    if (amplitude > 0) {
      // Apply envelope for smoother sound
      const ringPosition = cyclePosition % ringDuration;
      const attack = Math.min(ringPosition * 50, 1);
      const release = Math.min((ringDuration - ringPosition) * 50, 1);
      const envelope = attack * release;
      
      data[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude * envelope;
    } else {
      data[i] = 0;
    }
  }
  
  // Apply overall fade out at the end
  const fadeOutStart = totalSamples * 0.7;
  for (let i = Math.floor(fadeOutStart); i < totalSamples; i++) {
    const fadeProgress = (i - fadeOutStart) / (totalSamples - fadeOutStart);
    data[i] *= 1 - fadeProgress;
  }
  
  return buffer;
};

export const useNotificationSound = (duration: number = 3) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(false);

  // Initialize audio context and create ringtone buffer
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      ringtoneBufferRef.current = createRingtone(audioContextRef.current, duration);
    }
  }, [duration]);

  const play = useCallback(async () => {
    if (isPlayingRef.current) return;
    
    try {
      initAudio();
      
      if (!audioContextRef.current || !ringtoneBufferRef.current) return;
      
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      isPlayingRef.current = true;
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = ringtoneBufferRef.current;
      
      // Add gain node for volume control
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0.5;
      
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        isPlayingRef.current = false;
        sourceRef.current = null;
      };
      
      sourceRef.current = source;
      source.start(0);
    } catch (error) {
      console.error('Error playing notification sound:', error);
      isPlayingRef.current = false;
    }
  }, [initAudio]);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      sourceRef.current = null;
      isPlayingRef.current = false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stop]);

  return { play, stop, isPlaying: isPlayingRef.current };
};

export default useNotificationSound;
