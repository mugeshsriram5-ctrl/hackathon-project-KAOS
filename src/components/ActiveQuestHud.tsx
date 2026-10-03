import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActiveQuestHudProps {
  quest: any; // The structured JSON quest returned from Gemini
  onComplete: () => void;
  onSkip: () => void;
  onNavigateTab: (tab: any) => void;
  onShowToast: (msg: string) => void;
}

export const ActiveQuestHud: React.FC<ActiveQuestHudProps> = ({
  quest,
  onComplete,
  onSkip,
  onNavigateTab,
  onShowToast,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!quest) return null;

  const handleLaunchNavigation = () => {
    if (quest.navigation?.destination_latitude && quest.navigation?.destination_longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${quest.navigation.destination_latitude},${quest.navigation.destination_longitude}`;
      window.open(url, '_blank');
      onShowToast(`Launching directions to ${quest.navigation.destination_name || 'destination'}! 🗺️`);
    } else {
      // Fallback to place coordinates or query name
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(quest.title)}`;
      window.open(url, '_blank');
      onShowToast(`Searching destination on Google Maps! 🧭`);
    }
  };

  const handleOpenArLiveLens = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Keep track of stream or handle passing to camera component
      console.log('Camera access granted', stream);
      onNavigateTab('map');
      onShowToast(`AR Live Lens activated! Stand near the target to analyze telemetry. 🤳✨`);
    } catch (err) {
      console.error('Camera access denied:', err);
      onShowToast('Camera access is required for Live Lens! 📸');
    }
  };

  return (
    <div className="fixed top-20 left-4 right-4 md:left-auto md:right-8 md:w-96 z-40">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="bg-gradient-to-br from-[#2E1408] to-[#1C1A1F] border border-orange-500/40 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-4 bg-black/40 flex items-center justify-between gap-2 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <div>
                <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-orange-400">Active Exploration Quest</p>
                <h4 className="text-xs font-bold text-white tracking-tight mt-0.5 truncate max-w-[200px]">
                  {quest.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono font-bold bg-[#F05423]/15 text-[#F05423] border border-[#F05423]/35 px-1.5 py-0.5 rounded uppercase">
                {quest.difficulty || 'Easy'}
              </span>
              <span className="material-symbols-outlined text-zinc-400 text-lg">
                {isExpanded ? 'expand_less' : 'expand_more'}
              </span>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="p-5 space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{quest.description}</p>
                {quest.objective && (
                  <p className="text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl mt-1.5 leading-normal">
                    🎯 <strong>Objective:</strong> {quest.objective}
                  </p>
                )}
              </div>

              {/* Steps/Instructions */}
              {quest.instructions && quest.instructions.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">Explorer Instructions</h5>
                  <ol className="space-y-1.5">
                    {quest.instructions.map((step: string, index: number) => (
                      <li key={index} className="text-xs text-zinc-300 flex items-start gap-2">
                        <span className="text-orange-400 font-bold font-mono text-[11px] shrink-0 mt-0.5">
                          {index + 1}.
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Physical Demand details */}
              {quest.physical_demand && (
                <div className="flex items-center gap-4 text-[10px] text-zinc-400 font-mono bg-black/20 p-2 rounded-xl border border-[#26242C]">
                  <div>
                    <span className="text-zinc-500 font-bold">WALK:</span>{' '}
                    <span className="text-zinc-200">{quest.physical_demand.estimated_walking_minutes || 5} min</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold">TERRAIN:</span>{' '}
                    <span className="text-zinc-200 uppercase">{quest.physical_demand.terrain || 'Flat'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold">DEMAND:</span>{' '}
                    <span className="text-zinc-200 uppercase">{quest.physical_demand.level || 'Low'}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#26242C]/40">
                <button
                  onClick={handleLaunchNavigation}
                  className="py-2.5 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-300 hover:text-white font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1"
                  title="Open in Google Maps"
                >
                  <span className="material-symbols-outlined text-[15px]">directions</span>
                  <span>Directions</span>
                </button>

                {quest.ar_live_lens?.available ? (
                  <button
                    onClick={handleOpenArLiveLens}
                    className="py-2.5 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-cyan-500/10 hover:from-cyan-600/40 border border-cyan-500/40 text-cyan-400 font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1"
                    title="Unlock AR Lens view"
                  >
                    <span className="material-symbols-outlined text-[15px]">view_in_ar</span>
                    <span>Live Lens</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onNavigateTab('map');
                      onShowToast('Navigating map to target geofence coordinates! 🗺️');
                    }}
                    className="py-2.5 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-300 hover:text-white font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">map</span>
                    <span>View Map</span>
                  </button>
                )}
              </div>

              {/* Complete & Skip Row */}
              <div className="grid grid-cols-12 gap-2 pt-1">
                <button
                  onClick={onSkip}
                  className="col-span-4 py-2.5 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-500 hover:text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
                  title="Skip this quest"
                >
                  Skip
                </button>

                <button
                  onClick={onComplete}
                  className="col-span-8 py-2.5 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white font-extrabold text-xs cursor-pointer shadow-lg shadow-[#F05423]/15 flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">done_all</span>
                  <span>Complete & Claim</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
