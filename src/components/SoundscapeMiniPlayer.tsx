import React, { useState } from 'react';
import { useSoundscape, TrackId } from '../context/SoundscapeContext';
import { MasterSpot } from '../types';
import { SoundscapeMixerModal } from './SoundscapeMixerModal';

interface SoundscapeMiniPlayerProps {
  onOpenSpotDossier: (spot: MasterSpot) => void;
}

export const SoundscapeMiniPlayer: React.FC<SoundscapeMiniPlayerProps> = ({ onOpenSpotDossier }) => {
  const {
    currentSpot,
    isPlaying,
    masterVolume,
    tracks,
    togglePlay,
    stopSoundscape,
    setMasterVolume,
    setTrackVolume,
    toggleTrackMute,
    isMiniPlayerVisible,
    setIsMixerOpen,
  } = useSoundscape();

  const [isQuickExpanded, setIsQuickExpanded] = useState<boolean>(false);

  if (!isMiniPlayerVisible || !currentSpot) return null;

  const trackList = Object.values(tracks);
  const activeCount = trackList.filter((t) => !t.isMuted && t.volume > 0).length;

  return (
    <>
      <div className="fixed bottom-16 md:bottom-6 right-4 left-4 md:left-auto md:w-[420px] z-40 transition-all">
        <div className="bg-[#1C1A1F]/95 backdrop-blur-2xl border border-[#26242C] hover:border-[#F05423]/40 rounded-2xl shadow-2xl p-3.5 space-y-2.5">
          {/* Main Mini-Bar Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Thumbnail & Animated Wave */}
            <div
              onClick={() => onOpenSpotDossier(currentSpot)}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1 group"
            >
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-[#26242C]">
                {currentSpot.imageUrl ? (
                  <img
                    src={currentSpot.imageUrl}
                    alt={currentSpot.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full bg-[#121114] flex items-center justify-center text-lg">
                    🎧
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-[#F05423]/30 flex items-center justify-center gap-0.5">
                    <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:0ms]"></span>
                    <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:150ms]"></span>
                    <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]"></span>
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-[#F05423] transition-colors">
                  {currentSpot.title}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                  <span className="material-symbols-outlined text-[11px] text-[#F05423]">graphic_eq</span>
                  <span>{currentSpot.soundscapeType}</span>
                </p>
              </div>
            </div>

            {/* Right: Controls & Mixer Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Dedicated Full Mixer Modal Button */}
              <button
                onClick={() => setIsMixerOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] hover:border-[#F05423]/50 text-xs text-zinc-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer group"
                title="Open Multi-Track Studio Mixer"
              >
                <span className="material-symbols-outlined text-[15px] text-[#F05423] group-hover:rotate-45 transition-transform">
                  tune
                </span>
                <span className="text-[11px] font-bold hidden sm:inline">Mixer</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#F05423]/20 text-[#F05423] text-[9px] font-mono font-bold">
                  {activeCount}
                </span>
              </button>

              {/* Quick Inline Drawer Toggle */}
              <button
                onClick={() => setIsQuickExpanded(!isQuickExpanded)}
                title="Quick volume sliders"
                className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                  isQuickExpanded
                    ? 'bg-[#F05423]/20 border-[#F05423]/50 text-[#F05423]'
                    : 'bg-[#121114] border-[#26242C] text-zinc-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isQuickExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F05423] to-[#FF8A00] hover:brightness-110 text-white flex items-center justify-center shadow-md shadow-[#F05423]/30 transition-transform active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>

              {/* Close / Dismiss */}
              <button
                onClick={stopSoundscape}
                title="Close Soundscape Player"
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>

          {/* Quick Inline Drawer: Multi-track Quick Sliders */}
          {isQuickExpanded && (
            <div className="pt-2 border-t border-[#26242C] space-y-2.5 animate-fadeIn">
              {/* Quick Faders Grid */}
              <div className="space-y-1.5">
                {(['rain', 'cafe', 'wind', 'bells'] as TrackId[]).map((tid) => {
                  const t = tracks[tid];
                  const percent = Math.round(t.volume * 100);
                  const isLive = isPlaying && !t.isMuted;

                  return (
                    <div
                      key={tid}
                      className="flex items-center justify-between gap-2 text-xs bg-[#141216] px-2.5 py-1.5 rounded-xl border border-[#222026]"
                    >
                      <button
                        onClick={() => toggleTrackMute(tid)}
                        className={`flex items-center gap-1.5 text-[11px] font-medium cursor-pointer ${
                          !t.isMuted ? 'text-white' : 'text-zinc-500 line-through'
                        }`}
                        title={t.isMuted ? 'Unmute' : 'Mute'}
                      >
                        <span>{t.icon}</span>
                        <span className="truncate max-w-[85px] sm:max-w-none">{t.name.split(' ')[0]}</span>
                      </button>

                      <div className="flex items-center gap-2 flex-1 max-w-[170px]">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.02"
                          value={t.isMuted ? 0 : t.volume}
                          disabled={t.isMuted}
                          onChange={(e) => setTrackVolume(tid, parseFloat(e.target.value))}
                          className="w-full h-1 bg-[#26242C] rounded-lg appearance-none cursor-pointer accent-[#F05423] disabled:opacity-30"
                        />
                        <span className="text-[10px] font-mono text-zinc-400 w-7 text-right tabular-nums">
                          {t.isMuted ? 'off' : `${percent}%`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Master Volume Slider Row */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#26242C]/70 text-zinc-400">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="material-symbols-outlined text-[14px]">
                    {masterVolume === 0 ? 'volume_off' : masterVolume < 0.5 ? 'volume_down' : 'volume_up'}
                  </span>
                  <span className="font-mono uppercase text-[9px] font-bold">Master</span>
                </div>
                <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#26242C] rounded-lg appearance-none cursor-pointer accent-[#F05423]"
                  />
                  <span className="text-[10px] font-mono text-zinc-300 w-7 text-right tabular-nums font-bold">
                    {Math.round(masterVolume * 100)}%
                  </span>
                </div>

                <button
                  onClick={() => setIsMixerOpen(true)}
                  className="text-[10px] font-mono text-[#F05423] hover:underline cursor-pointer shrink-0"
                >
                  Full Mixer →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Studio Soundscape Mixer Modal */}
      <SoundscapeMixerModal />
    </>
  );
};

export default SoundscapeMiniPlayer;
