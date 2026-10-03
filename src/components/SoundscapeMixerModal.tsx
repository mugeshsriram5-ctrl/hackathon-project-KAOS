import React from 'react';
import { useSoundscape, TrackId, SoundscapePreset } from '../context/SoundscapeContext';

export const SoundscapeMixerModal: React.FC = () => {
  const {
    currentSpot,
    isPlaying,
    masterVolume,
    tracks,
    togglePlay,
    setMasterVolume,
    setTrackVolume,
    toggleTrackMute,
    applyPreset,
    isMixerOpen,
    setIsMixerOpen,
  } = useSoundscape();

  if (!isMixerOpen || !currentSpot) return null;

  const trackList = Object.values(tracks);
  const activeCount = trackList.filter((t) => !t.isMuted && t.volume > 0).length;

  const presets: { key: SoundscapePreset; label: string; icon: string }[] = [
    { key: 'balanced', label: 'Balanced', icon: '⚖️' },
    { key: 'monsoon', label: 'Monsoon Rain', icon: '🌧️' },
    { key: 'roastery', label: 'Morning Roastery', icon: '☕' },
    { key: 'marina', label: 'Marina Breeze', icon: '🌊' },
    { key: 'temple', label: 'Sacred Temple', icon: '🛕' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={() => setIsMixerOpen(false)} />

      {/* Mixer Console Container */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#1C1A1F] to-[#121114] border border-[#26242C] shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#26242C] flex items-center justify-between gap-3 bg-[#151318]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F05423] to-[#FF8A00] flex items-center justify-center text-white shadow-lg shadow-[#F05423]/25 shrink-0">
              <span className="material-symbols-outlined text-[22px]">equalizer</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  Atmospheric Sound Studio
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F05423]/20 border border-[#F05423]/40 text-[#F05423] font-semibold shrink-0">
                  {activeCount} / 5 Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Layering acoustics for <span className="text-zinc-200 font-medium">{currentSpot.title}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMixerOpen(false)}
            className="w-9 h-9 rounded-xl bg-[#1C1A1F] hover:bg-[#26242C] border border-[#26242C] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close Mixer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Master Control & Presets Section */}
        <div className="p-4 sm:p-5 border-b border-[#26242C] bg-[#121114]/90 space-y-4">
          {/* Master Volume Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={togglePlay}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#F05423] to-[#FF8A00] hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#F05423]/30 transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
                <span>{isPlaying ? 'Pause All' : 'Play Soundscape'}</span>
              </button>

              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Master Volume
              </span>
            </div>

            <div className="flex items-center gap-3 flex-1 sm:max-w-xs">
              <span className="material-symbols-outlined text-zinc-500 text-[16px]">
                {masterVolume === 0 ? 'volume_off' : masterVolume < 0.5 ? 'volume_down' : 'volume_up'}
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={masterVolume}
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#26242C] rounded-lg appearance-none cursor-pointer accent-[#F05423]"
              />
              <span className="text-xs font-mono text-white font-bold w-9 text-right tabular-nums">
                {Math.round(masterVolume * 100)}%
              </span>
            </div>
          </div>

          {/* Quick Studio Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Acoustic Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#1C1A1F] hover:bg-[#26242C] border border-[#26242C] hover:border-[#F05423]/40 text-xs text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{p.icon}</span>
                  <span className="font-medium text-[11px]">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-Track Channel Strips */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {trackList.map((track) => {
            const isMuted = track.isMuted;
            const volumePercent = Math.round(track.volume * 100);
            const isLive = isPlaying && !isMuted && track.volume > 0;

            return (
              <div
                key={track.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isLive
                    ? 'bg-[#18161D] border-[#F05423]/40 shadow-lg shadow-black/40'
                    : 'bg-[#141216] border-[#222026] opacity-75'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left Track Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Track Icon & Active Glow */}
                    <div className="relative">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all shrink-0 ${
                          isLive
                            ? 'bg-[#1E1B24] border-[#F05423]/60 shadow-md shadow-[#F05423]/20'
                            : 'bg-[#121114] border-[#26242C]'
                        }`}
                      >
                        {track.icon}
                      </div>
                      {isLive && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {track.name}
                        </h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 uppercase">
                          {track.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {track.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Mute & Slider */}
                  <div className="flex items-center gap-3 sm:w-64 shrink-0">
                    {/* Dynamic VU Meter */}
                    {isLive ? (
                      <div className="flex items-end gap-0.5 h-4 w-4 shrink-0">
                        <span
                          className="w-1 bg-[#F05423] rounded-full animate-bounce [animation-delay:0ms]"
                          style={{ height: `${Math.max(25, volumePercent)}%` }}
                        />
                        <span
                          className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:120ms]"
                          style={{ height: `${Math.max(40, volumePercent * 0.9)}%` }}
                        />
                        <span
                          className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:240ms]"
                          style={{ height: `${Math.max(15, volumePercent * 0.7)}%` }}
                        />
                      </div>
                    ) : (
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                      </div>
                    )}

                    {/* Mute Toggle Button */}
                    <button
                      onClick={() => toggleTrackMute(track.id)}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                        isMuted
                          ? 'bg-[#1C1A1F] border-[#26242C] text-zinc-500 hover:text-zinc-300'
                          : 'bg-[#F05423]/20 border-[#F05423]/60 text-[#F05423]'
                      }`}
                      title={isMuted ? 'Unmute Track' : 'Mute Track'}
                    >
                      {isMuted ? 'Muted' : 'Active'}
                    </button>

                    {/* Volume Slider */}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={isMuted ? 0 : track.volume}
                      disabled={isMuted}
                      onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#26242C] rounded-lg appearance-none cursor-pointer accent-[#F05423] disabled:opacity-40"
                    />

                    {/* Volume % Value */}
                    <span className="text-[11px] font-mono text-zinc-300 font-semibold w-8 text-right tabular-nums shrink-0">
                      {isMuted ? '0%' : `${volumePercent}%`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="p-3 px-5 bg-[#151318] border-t border-[#26242C] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Real-time Web Audio Synthesizer</span>
          <span className="text-[#F05423]">Binaural Coromandel Acoustics</span>
        </div>
      </div>
    </div>
  );
};

export default SoundscapeMixerModal;
