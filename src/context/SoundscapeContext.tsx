import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { MasterSpot } from '../types';

export type TrackId = 'spot' | 'rain' | 'cafe' | 'wind' | 'bells';

export interface MixerTrackState {
  id: TrackId;
  name: string;
  category: string;
  icon: string;
  volume: number; // 0 to 1
  isMuted: boolean;
  description: string;
}

export type SoundscapePreset = 'monsoon' | 'roastery' | 'marina' | 'temple' | 'balanced';

interface SoundscapeContextType {
  currentSpot: MasterSpot | null;
  isPlaying: boolean;
  masterVolume: number;
  tracks: Record<TrackId, MixerTrackState>;
  playSpotSoundscape: (spot: MasterSpot) => void;
  togglePlay: () => void;
  stopSoundscape: () => void;
  setMasterVolume: (volume: number) => void;
  setTrackVolume: (trackId: TrackId, volume: number) => void;
  toggleTrackMute: (trackId: TrackId) => void;
  applyPreset: (preset: SoundscapePreset) => void;
  isMiniPlayerVisible: boolean;
  setIsMiniPlayerVisible: (visible: boolean) => void;
  isMixerOpen: boolean;
  setIsMixerOpen: (open: boolean) => void;
}

const INITIAL_TRACKS: Record<TrackId, MixerTrackState> = {
  spot: {
    id: 'spot',
    name: 'Landmark Lore',
    category: 'Acoustic Vault',
    icon: '🏛️',
    volume: 0.85,
    isMuted: false,
    description: 'Resonant harmonic drones tailored to architectural acoustics',
  },
  rain: {
    id: 'rain',
    name: 'City Rain & Monsoon',
    category: 'Weather',
    icon: '🌧️',
    volume: 0.45,
    isMuted: true,
    description: 'Filtered pink noise drops & Coromandel monsoon downpour',
  },
  cafe: {
    id: 'cafe',
    name: 'Cafe Chatter & Roastery',
    category: 'Urban Atmosphere',
    icon: '☕',
    volume: 0.4,
    isMuted: true,
    description: 'Bustling Mylapore coffee house chatter & porcelain clinks',
  },
  wind: {
    id: 'wind',
    name: 'Coastal Wind & Breeze',
    category: 'Nature',
    icon: '💨',
    volume: 0.5,
    isMuted: true,
    description: 'Marina Beach Bay of Bengal undulating shoreline breeze',
  },
  bells: {
    id: 'bells',
    name: 'Sacred Temple Bells',
    category: 'Harmonics',
    icon: '🔔',
    volume: 0.6,
    isMuted: false,
    description: '528Hz / 432Hz bronze gongs & ancient belfry chimes',
  },
};

const SoundscapeContext = createContext<SoundscapeContextType | null>(null);

export const SoundscapeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSpot, setCurrentSpot] = useState<MasterSpot | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [masterVolume, setMasterVolumeState] = useState<number>(0.75);
  const [tracks, setTracks] = useState<Record<TrackId, MixerTrackState>>(INITIAL_TRACKS);
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState<boolean>(false);
  const [isMixerOpen, setIsMixerOpen] = useState<boolean>(false);

  // Audio Context & Channel Gain Nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Individual Track Gains
  const trackGainsRef = useRef<Record<TrackId, GainNode | null>>({
    spot: null,
    rain: null,
    cafe: null,
    wind: null,
    bells: null,
  });

  // Track Node Handles
  const spotOscillatorsRef = useRef<OscillatorNode[]>([]);
  const rainSourceRef = useRef<AudioNode | null>(null);
  const cafeNodesRef = useRef<{ source: AudioNode; interval: number | null } | null>(null);
  const windNodesRef = useRef<{ source: AudioNode; lfo: OscillatorNode } | null>(null);
  const bellIntervalRef = useRef<number | null>(null);

  // Initialize Audio Context & Master Gain
  const initAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const master = ctx.createGain();
        master.gain.setValueAtTime(masterVolume, ctx.currentTime);
        master.connect(ctx.destination);
        masterGainRef.current = master;

        // Build individual gain nodes
        (Object.keys(INITIAL_TRACKS) as TrackId[]).forEach((tid) => {
          const tGain = ctx.createGain();
          const targetVol = tracks[tid].isMuted ? 0 : tracks[tid].volume;
          tGain.gain.setValueAtTime(targetVol, ctx.currentTime);
          tGain.connect(master);
          trackGainsRef.current[tid] = tGain;
        });
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, [masterVolume, tracks]);

  // Master Volume Setter
  const setMasterVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setMasterVolumeState(clamped);
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(clamped, audioCtxRef.current.currentTime, 0.05);
    }
  };

  // Adjust Individual Track Volume
  const setTrackVolume = (trackId: TrackId, vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setTracks((prev) => {
      const updated = {
        ...prev,
        [trackId]: { ...prev[trackId], volume: clamped },
      };
      if (trackGainsRef.current[trackId] && audioCtxRef.current) {
        const effectiveVol = updated[trackId].isMuted ? 0 : clamped;
        trackGainsRef.current[trackId]!.gain.setTargetAtTime(
          effectiveVol,
          audioCtxRef.current.currentTime,
          0.05
        );
      }
      return updated;
    });
  };

  // Toggle Individual Track Mute
  const toggleTrackMute = (trackId: TrackId) => {
    setTracks((prev) => {
      const newMuted = !prev[trackId].isMuted;
      const updated = {
        ...prev,
        [trackId]: { ...prev[trackId], isMuted: newMuted },
      };
      if (trackGainsRef.current[trackId] && audioCtxRef.current) {
        const effectiveVol = newMuted ? 0 : updated[trackId].volume;
        trackGainsRef.current[trackId]!.gain.setTargetAtTime(
          effectiveVol,
          audioCtxRef.current.currentTime,
          0.05
        );
      }
      return updated;
    });
  };

  // Procedural 1: City Rain & Monsoon Downpour
  const startRainGenerator = (ctx: AudioContext, destination: GainNode) => {
    try {
      if (rainSourceRef.current) {
        try {
          rainSourceRef.current.disconnect();
        } catch {}
      }
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.76160 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.12;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(820, ctx.currentTime);

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(200, ctx.currentTime);

      whiteNoise.connect(lowpass);
      lowpass.connect(highpass);
      highpass.connect(destination);

      whiteNoise.start();
      rainSourceRef.current = whiteNoise;
    } catch (e) {
      console.warn('Rain generation error:', e);
    }
  };

  // Procedural 2: Cafe Chatter & Roastery Murmur
  const startCafeGenerator = (ctx: AudioContext, destination: GainNode) => {
    try {
      if (cafeNodesRef.current?.source) {
        try {
          cafeNodesRef.current.source.disconnect();
        } catch {}
      }
      if (cafeNodesRef.current?.interval) {
        window.clearInterval(cafeNodesRef.current.interval);
      }

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 1.4;
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      // Bandpass speech formant filter (600Hz - 2200Hz chatter zone)
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(950, ctx.currentTime);
      bandpass.Q.setValueAtTime(1.8, ctx.currentTime);

      source.connect(bandpass);
      bandpass.connect(destination);
      source.start();

      // Rhythmic Porcelain Cup & Spoon Clinks
      const interval = window.setInterval(() => {
        if (!audioCtxRef.current || !trackGainsRef.current.cafe) return;
        try {
          const actx = audioCtxRef.current;
          const osc = actx.createOscillator();
          const clinkGain = actx.createGain();
          const clinkFreqs = [2400, 3100, 3900, 4400];
          osc.type = 'sine';
          osc.frequency.setValueAtTime(
            clinkFreqs[Math.floor(Math.random() * clinkFreqs.length)],
            actx.currentTime
          );

          clinkGain.gain.setValueAtTime(0, actx.currentTime);
          clinkGain.gain.linearRampToValueAtTime(0.04, actx.currentTime + 0.005);
          clinkGain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.25);

          osc.connect(clinkGain);
          clinkGain.connect(destination);
          osc.start(actx.currentTime);
          osc.stop(actx.currentTime + 0.3);
        } catch {}
      }, 5500);

      cafeNodesRef.current = { source, interval };
    } catch (e) {
      console.warn('Cafe chatter generator error:', e);
    }
  };

  // Procedural 3: Coastal Wind & Undulating Shoreline Breeze
  const startWindGenerator = (ctx: AudioContext, destination: GainNode) => {
    try {
      if (windNodesRef.current?.source) {
        try {
          windNodesRef.current.source.disconnect();
          windNodesRef.current.lfo.stop();
        } catch {}
      }

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.018 * white) / 1.018;
        lastOut = output[i];
        output[i] *= 1.8;
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      // Resonant Lowpass Filter with gentle breathing LFO
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.Q.setValueAtTime(3.0, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.09, ctx.currentTime); // 11-second gentle swell
      lfoGain.gain.setValueAtTime(140, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      source.connect(filter);
      filter.connect(destination);

      source.start();
      lfo.start();

      windNodesRef.current = { source, lfo };
    } catch (e) {
      console.warn('Wind generator error:', e);
    }
  };

  // Procedural 4: Sacred Temple Bells Harmonics
  const triggerBellChime = (ctx: AudioContext, destination: GainNode, fundamental: number = 528) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental, ctx.currentTime);

      // Bell envelope (sharp 20ms attack, 4s resonant decay)
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.2);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 4.3);
    } catch {}
  };

  const startBellsScheduler = (ctx: AudioContext, destination: GainNode) => {
    if (bellIntervalRef.current) {
      window.clearInterval(bellIntervalRef.current);
    }
    // Initial chime
    triggerBellChime(ctx, destination, 528);

    const interval = window.setInterval(() => {
      if (!audioCtxRef.current || !trackGainsRef.current.bells) return;
      const notes = [432, 528, 648, 720, 864];
      const note = notes[Math.floor(Math.random() * notes.length)];
      triggerBellChime(audioCtxRef.current, destination, note);
    }, 6500);

    bellIntervalRef.current = interval;
  };

  // Procedural 5: Spot Architectural Drone Synthesis
  const startSpotDrone = (ctx: AudioContext, destination: GainNode, spot: MasterSpot) => {
    spotOscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    spotOscillatorsRef.current = [];

    const type = spot.soundscapeType?.toLowerCase() || '';
    let baseFreq = 220; // A3
    let overtoneFreq = 330; // E4

    if (type.includes('temple') || type.includes('acoustic') || type.includes('vault')) {
      baseFreq = 216; // Harmonic 432 / 2
      overtoneFreq = 432;
    } else if (type.includes('coffee') || type.includes('roastery')) {
      baseFreq = 164.81; // E3 warm roastery drone
      overtoneFreq = 246.94;
    } else if (type.includes('corridor') || type.includes('fort')) {
      baseFreq = 146.83; // D3 ancient stonework
      overtoneFreq = 293.66;
    }

    // Drone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);

    // Drone 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(overtoneFreq, ctx.currentTime);
    gain2.gain.setValueAtTime(0.06, ctx.currentTime);

    // LFO breathing
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.14, ctx.currentTime);
    lfoGain.gain.setValueAtTime(0.03, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(gain1.gain);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(680, ctx.currentTime);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(destination);

    osc1.start();
    osc2.start();
    lfo.start();
    spotOscillatorsRef.current = [osc1, osc2, lfo];
  };

  const stopAllAudio = () => {
    spotOscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    spotOscillatorsRef.current = [];

    if (rainSourceRef.current) {
      try {
        rainSourceRef.current.disconnect();
      } catch {}
      rainSourceRef.current = null;
    }

    if (cafeNodesRef.current) {
      try {
        cafeNodesRef.current.source.disconnect();
      } catch {}
      if (cafeNodesRef.current.interval) window.clearInterval(cafeNodesRef.current.interval);
      cafeNodesRef.current = null;
    }

    if (windNodesRef.current) {
      try {
        windNodesRef.current.source.disconnect();
        windNodesRef.current.lfo.stop();
      } catch {}
      windNodesRef.current = null;
    }

    if (bellIntervalRef.current) {
      window.clearInterval(bellIntervalRef.current);
      bellIntervalRef.current = null;
    }
  };

  const startAllGenerators = (spot: MasterSpot) => {
    const ctx = initAudioCtx();
    if (!ctx) return;

    stopAllAudio();

    // Start Spot Drone
    if (trackGainsRef.current.spot) {
      startSpotDrone(ctx, trackGainsRef.current.spot, spot);
    }

    // Start Rain Generator
    if (trackGainsRef.current.rain) {
      startRainGenerator(ctx, trackGainsRef.current.rain);
    }

    // Start Cafe Generator
    if (trackGainsRef.current.cafe) {
      startCafeGenerator(ctx, trackGainsRef.current.cafe);
    }

    // Start Wind Generator
    if (trackGainsRef.current.wind) {
      startWindGenerator(ctx, trackGainsRef.current.wind);
    }

    // Start Bells Generator
    if (trackGainsRef.current.bells) {
      startBellsScheduler(ctx, trackGainsRef.current.bells);
    }
  };

  const playSpotSoundscape = (spot: MasterSpot) => {
    setCurrentSpot(spot);
    setIsPlaying(true);
    setIsMiniPlayerVisible(true);
    startAllGenerators(spot);
  };

  const togglePlay = () => {
    if (!currentSpot) return;
    if (isPlaying) {
      stopAllAudio();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      startAllGenerators(currentSpot);
    }
  };

  const stopSoundscape = () => {
    stopAllAudio();
    setIsPlaying(false);
    setIsMiniPlayerVisible(false);
    setIsMixerOpen(false);
  };

  // Studio Presets
  const applyPreset = (preset: SoundscapePreset) => {
    setTracks((prev) => {
      const next = { ...prev };
      switch (preset) {
        case 'monsoon':
          next.spot = { ...next.spot, isMuted: false, volume: 0.75 };
          next.rain = { ...next.rain, isMuted: false, volume: 0.65 };
          next.cafe = { ...next.cafe, isMuted: true, volume: 0.3 };
          next.wind = { ...next.wind, isMuted: false, volume: 0.5 };
          next.bells = { ...next.bells, isMuted: false, volume: 0.35 };
          break;
        case 'roastery':
          next.spot = { ...next.spot, isMuted: false, volume: 0.6 };
          next.rain = { ...next.rain, isMuted: true, volume: 0.2 };
          next.cafe = { ...next.cafe, isMuted: false, volume: 0.7 };
          next.wind = { ...next.wind, isMuted: true, volume: 0.2 };
          next.bells = { ...next.bells, isMuted: false, volume: 0.4 };
          break;
        case 'marina':
          next.spot = { ...next.spot, isMuted: false, volume: 0.6 };
          next.rain = { ...next.rain, isMuted: true, volume: 0.2 };
          next.cafe = { ...next.cafe, isMuted: true, volume: 0.2 };
          next.wind = { ...next.wind, isMuted: false, volume: 0.75 };
          next.bells = { ...next.bells, isMuted: true, volume: 0.3 };
          break;
        case 'temple':
          next.spot = { ...next.spot, isMuted: false, volume: 0.8 };
          next.rain = { ...next.rain, isMuted: true, volume: 0.2 };
          next.cafe = { ...next.cafe, isMuted: true, volume: 0.2 };
          next.wind = { ...next.wind, isMuted: false, volume: 0.3 };
          next.bells = { ...next.bells, isMuted: false, volume: 0.8 };
          break;
        case 'balanced':
          next.spot = { ...next.spot, isMuted: false, volume: 0.8 };
          next.rain = { ...next.rain, isMuted: false, volume: 0.4 };
          next.cafe = { ...next.cafe, isMuted: true, volume: 0.35 };
          next.wind = { ...next.wind, isMuted: false, volume: 0.35 };
          next.bells = { ...next.bells, isMuted: false, volume: 0.5 };
          break;
      }

      // Update Web Audio gains in real-time
      if (audioCtxRef.current) {
        (Object.keys(next) as TrackId[]).forEach((tid) => {
          if (trackGainsRef.current[tid]) {
            const vol = next[tid].isMuted ? 0 : next[tid].volume;
            trackGainsRef.current[tid]!.gain.setTargetAtTime(
              vol,
              audioCtxRef.current!.currentTime,
              0.08
            );
          }
        });
      }
      return next;
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  return (
    <SoundscapeContext.Provider
      value={{
        currentSpot,
        isPlaying,
        masterVolume,
        tracks,
        playSpotSoundscape,
        togglePlay,
        stopSoundscape,
        setMasterVolume,
        setTrackVolume,
        toggleTrackMute,
        applyPreset,
        isMiniPlayerVisible,
        setIsMiniPlayerVisible,
        isMixerOpen,
        setIsMixerOpen,
      }}
    >
      {children}
    </SoundscapeContext.Provider>
  );
};

export const useSoundscape = () => {
  const context = useContext(SoundscapeContext);
  if (!context) {
    throw new Error('useSoundscape must be used within a SoundscapeProvider');
  }
  return context;
};
