import React, { useState, useEffect } from 'react';
import { MasterSpot, RecommendedSpot } from '../types';
import { sqlDb } from '../lib/sqlDatabase';
import { useSoundscape } from '../context/SoundscapeContext';

interface RecommendedSectionProps {
  onSpotSelected: (spot: MasterSpot) => void;
  onShowToast: (msg: string) => void;
}

export const RecommendedSection: React.FC<RecommendedSectionProps> = ({
  onSpotSelected,
  onShowToast,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedSpot[]>(() =>
    sqlDb.getRecommendedSpots(4)
  );
  const [summary, setSummary] = useState(() => sqlDb.getExploredTagsSummary());
  const { playSpotSoundscape, currentSpot, isPlaying } = useSoundscape();

  const refreshRecommendations = () => {
    setRecommendations(sqlDb.getRecommendedSpots(4));
    setSummary(sqlDb.getExploredTagsSummary());
  };

  useEffect(() => {
    refreshRecommendations();

    const handleExplored = () => {
      refreshRecommendations();
    };

    window.addEventListener('kaos-spot-explored', handleExplored);
    return () => window.removeEventListener('kaos-spot-explored', handleExplored);
  }, []);

  const handleSpotClick = (spot: MasterSpot) => {
    // Record view exploration in SQL database
    sqlDb.recordSpotExplored(spot, 'viewed');
    onSpotSelected(spot);
  };

  const handleSoundscapePlay = (e: React.MouseEvent, spot: MasterSpot) => {
    e.stopPropagation();
    sqlDb.recordSpotExplored(spot, 'audio_listened');
    playSpotSoundscape(spot);
    onShowToast(`Streaming binaural soundscape for ${spot.title} 🎧`);
  };

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#26242C] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F05423] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F05423]" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
              Affinity Mesh · Personalized Discovery
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <span>Recommended for You</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F05423]/15 border border-[#F05423]/40 text-[#F05423] font-mono font-bold">
              AI Match
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tailored landmarks reflecting your explored architectural movements and sectors
          </p>
        </div>

        {/* User Explored Affinity Tags */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {summary.topStyles.slice(0, 2).map((s) => (
            <span
              key={s.tag}
              className="text-[10px] font-mono px-2 py-1 rounded-lg bg-[#1C1A1F] border border-[#26242C] text-zinc-300 flex items-center gap-1"
              title={`Explored ${s.count} times`}
            >
              <span className="text-[#F05423]">🏛️</span>
              <span className="font-semibold">{s.tag}</span>
            </span>
          ))}

          {summary.topZones.slice(0, 1).map((z) => (
            <span
              key={z.tag}
              className="text-[10px] font-mono px-2 py-1 rounded-lg bg-[#1C1A1F] border border-[#26242C] text-zinc-300 flex items-center gap-1"
            >
              <span className="text-amber-400">📍</span>
              <span className="font-semibold">{z.tag}</span>
            </span>
          ))}

          <button
            onClick={() => {
              refreshRecommendations();
              onShowToast('Refreshed recommendation vector from SQL database ⚡');
            }}
            className="p-1.5 rounded-lg bg-[#1C1A1F] hover:bg-[#26242C] border border-[#26242C] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Recalculate recommendations from SQL telemetry"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Recommended Spots Grid / Track */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map(({ spot, matchScore, matchReason, matchedTags }) => {
          const isThisPlaying = currentSpot?.id === spot.id && isPlaying;

          return (
            <div
              key={spot.id}
              onClick={() => handleSpotClick(spot)}
              className="group bg-[#1C1A1F] border border-[#26242C] hover:border-[#F05423]/60 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#F05423]/15 cursor-pointer flex flex-col justify-between"
            >
              {/* Image & Match Score Header */}
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
                  <img
                    src={spot.imageUrl}
                    alt={spot.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A1F] via-transparent to-black/40" />

                  {/* Top Match Score Badge */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                    <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-[#F05423]/50 text-[10px] font-mono font-bold text-white flex items-center gap-1 shadow-md">
                      <span className="text-emerald-400">⚡</span>
                      <span className="text-[#FF8A00]">{matchScore}% Match</span>
                    </span>

                    <button
                      onClick={(e) => handleSoundscapePlay(e, spot)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
                        isThisPlaying
                          ? 'bg-[#F05423] text-white shadow-lg shadow-[#F05423]/50'
                          : 'bg-black/60 hover:bg-[#F05423] text-zinc-300 hover:text-white border border-white/10'
                      }`}
                      title="Play spatial soundscape"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {isThisPlaying ? 'graphic_eq' : 'play_arrow'}
                      </span>
                    </button>
                  </div>

                  {/* Bottom Image Metadata */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-zinc-300">
                    <span className="text-[10px] font-mono text-zinc-400">
                      {spot.vintageYear ? `Est. ${spot.vintageYear}` : 'Heritage'}
                    </span>
                    <span className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full bg-black/60 border border-white/10">
                      {spot.zone}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3.5 space-y-2">
                  {/* Explored Rationale Banner */}
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-300/90 bg-amber-950/40 border border-amber-500/20 px-2 py-1 rounded-xl">
                    <span className="material-symbols-outlined text-[13px] text-amber-400 shrink-0">
                      psychology
                    </span>
                    <span className="truncate">{matchReason}</span>
                  </div>

                  {/* Title & Architectural Movement */}
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#F05423] transition-colors line-clamp-1">
                      {spot.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {spot.architecturalStyle || spot.category}
                    </p>
                  </div>

                  {/* Matched Tags */}
                  <div className="flex flex-wrap gap-1">
                    {matchedTags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#141216] border border-[#26242C] text-zinc-400"
                      >
                        #{tag.replace(/\s+/g, '')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Action Bar */}
              <div className="p-3.5 pt-0 border-t border-[#26242C]/60 flex items-center justify-between text-xs text-zinc-400 mt-2">
                <span className="font-mono text-[10px] text-[#F05423] font-bold">
                  +{spot.xp} XP
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-300 group-hover:text-white">
                  <span>Dossier</span>
                  <span className="material-symbols-outlined text-[13px] group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RecommendedSection;
