import React, { useEffect } from 'react';
import { triggerConfettiCelebration } from '../lib/celebration';

interface LevelUpCelebrationModalProps {
  isOpen: boolean;
  newLevel: number;
  totalXp: number;
  onClose: () => void;
}

export const LevelUpCelebrationModal: React.FC<LevelUpCelebrationModalProps> = ({
  isOpen,
  newLevel,
  totalXp,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      triggerConfettiCelebration();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getRankTitle = (lvl: number) => {
    switch (lvl) {
      case 1:
        return 'Apprentice Scout';
      case 2:
        return 'Alley Chronicler';
      case 3:
        return 'Temple Tank Surveyor';
      case 4:
        return 'Coromandel Cartographer';
      case 5:
        return 'Master Cartographer';
      case 6:
        return 'Heritage Pathfinder';
      case 7:
        return 'Apex Architectural Scribe';
      default:
        return `Grand Cartographer Tier ${lvl}`;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-b from-[#1C1A1F] to-[#121114] border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 overflow-hidden cursor-default"
      >
        {/* Glowing Aura Background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-tr from-[#F05423]/30 via-amber-500/20 to-yellow-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Level Emblem */}
        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#F05423] via-amber-500 to-yellow-400 p-1 shadow-2xl shadow-amber-500/40">
          <div className="w-full h-full bg-[#121114] rounded-[22px] flex flex-col items-center justify-center">
            <span className="text-3xl">🛡️</span>
            <span className="text-[10px] font-mono uppercase font-bold text-amber-400 mt-1">
              Level {newLevel}
            </span>
          </div>
        </div>

        {/* Title & Honor */}
        <div className="space-y-1.5 relative">
          <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
            Milestone Achieved
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Rank Promotion!
          </h2>
          <p className="text-base font-bold text-[#F05423]">
            {getRankTitle(newLevel)}
          </p>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto pt-1">
            Your cumulative cartography score has reached{' '}
            <span className="text-white font-mono font-bold">{totalXp.toLocaleString()} XP</span>. New sector corridors and perks have been unlocked in your dossier.
          </p>
        </div>

        {/* Unlocked Attributes */}
        <div className="grid grid-cols-2 gap-2 text-left text-xs bg-[#121114]/80 border border-[#26242C] rounded-2xl p-3">
          <div className="space-y-0.5">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Radar Range</span>
            <p className="font-bold text-emerald-400">+250m Proximity</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Leaderboard Rank</span>
            <p className="font-bold text-amber-400">Promoted in SQL</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            triggerConfettiCelebration();
            onClose();
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#F05423] to-[#FF8A00] hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-[#F05423]/30 transition-transform active:scale-95 cursor-pointer"
        >
          Claim Honor & Continue Expedition
        </button>
      </div>
    </div>
  );
};

export default LevelUpCelebrationModal;
