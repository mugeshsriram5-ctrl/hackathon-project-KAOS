import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DailyRewardsState,
  DAILY_REWARDS_SCHEDULE,
  claimTodayReward,
  claim30DayMilestone,
  getSecondsUntilMidnight,
  formatCountdown,
  DailyRewardItem,
} from '../services/dailyRewardsService';

interface DailyRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardsState: DailyRewardsState;
  onRewardClaimed: (xp: number, message: string, newState: DailyRewardsState) => void;
  onShowToast: (msg: string) => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  isOpen,
  onClose,
  rewardsState,
  onRewardClaimed,
  onShowToast,
}) => {
  const [countdownSeconds, setCountdownSeconds] = useState(getSecondsUntilMidnight);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimCelebration, setClaimCelebration] = useState<{
    isOpen: boolean;
    reward?: DailyRewardItem;
    xpEarned: number;
  }>({ isOpen: false, xpEarned: 0 });

  // Live second-by-second countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownSeconds(getSecondsUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const handleClaim = () => {
    if (!rewardsState.isClaimableToday || isClaiming) return;
    setIsClaiming(true);

    try {
      const result = claimTodayReward(rewardsState);
      if (result.success && result.newState && result.reward) {
        onRewardClaimed(
          result.xpEarned || 0,
          `Claimed ${result.reward.title} for Day ${rewardsState.todayDayIndex}!`,
          result.newState
        );

        setClaimCelebration({
          isOpen: true,
          reward: result.reward,
          xpEarned: result.xpEarned || 0,
        });

        onShowToast(`🎉 Claimed Day ${rewardsState.todayDayIndex} Daily Reward! (+${result.xpEarned} XP)`);
      } else {
        onShowToast(result.error || "Could not claim today's reward.");
      }
    } catch (err) {
      onShowToast("Claim failed. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClaimMilestone = () => {
    const result = claim30DayMilestone(rewardsState);
    if (result.success && result.newState) {
      onRewardClaimed(2500, 'Unlocked 30-Day Expedition Grand Archaeo-Vault Mystery Chest!', result.newState);
      onShowToast('🏆 30-Day Milestone Claimed! +2,500 XP & "Epoch Pioneer" Title Granted!');
    } else {
      onShowToast(result.error || 'Milestone not yet available.');
    }
  };

  const percent30 = Math.min(100, Math.round((rewardsState.totalDaysSynchronized / 30) * 100));

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-[#0F0E13] border border-[#2E2B38] rounded-3xl p-5 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] relative overflow-hidden my-auto select-none"
      >
        {/* Top ambient glowing accent border line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-kaos-pink via-kaos-teal to-kaos-purple opacity-90" />

        {/* 1. Header Section */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#23202C]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-kaos-pink uppercase">
                PROTOCOL // DAILY CADENCE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-kaos-teal/15 border border-kaos-teal/40 text-kaos-teal text-[9px] font-mono font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-kaos-teal animate-pulse" />
                <span>CYCLE {rewardsState.currentCycle} ACTIVE</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
              CADET REWARDS CALENDAR
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Consecutive check-ins amplify your tactical cache keys and ancient relic cipher progress.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-[#1A1822] hover:bg-[#282434] border border-[#2E2B38] text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label="Close Daily Rewards"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* 2. Current Synchronization & Countdown Bar */}
        <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#171520] via-[#1A1824] to-[#14121C] border border-[#2A2736] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F05423]/25 to-amber-500/10 border border-[#F05423]/40 flex items-center justify-center text-2xl shrink-0 shadow-md">
              🔥
            </div>
            <div>
              <span className="text-[9.5px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">
                CURRENT SYNCHRONIZATION
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base sm:text-lg font-black text-white tracking-tight">
                  Streak: <span className="text-[#F05423]">Day {rewardsState.currentStreak} of 7</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-kaos-teal/15 text-kaos-teal text-[9px] font-mono font-bold border border-kaos-teal/30">
                  Active Cadence
                </span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-[#2A2736] pt-2.5 sm:pt-0">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Check-in Reset in
            </span>
            <span className="text-base sm:text-xl font-mono font-black text-kaos-teal drop-shadow-[0_0_8px_rgba(20,255,236,0.3)] tracking-wider">
              {formatCountdown(countdownSeconds)}
            </span>
          </div>
        </div>

        {/* 3. 7-Day Cadence Cycle Cards */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase text-zinc-400 font-bold tracking-wider flex items-center gap-1.5">
              <span>7-DAY CADENCE CYCLE</span>
            </h3>
            <span className="text-[11px] font-mono text-amber-400/90 font-medium">
              Day 7 yields Legendary Artifact
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 sm:gap-3">
            {DAILY_REWARDS_SCHEDULE.map((item) => {
              const isClaimed = rewardsState.claimedDays.includes(item.day);
              const isToday = rewardsState.todayDayIndex === item.day;
              const isAvailable = isToday && rewardsState.isClaimableToday;
              const isTomorrow = item.day === rewardsState.todayDayIndex + 1;
              const isLocked = item.day > rewardsState.todayDayIndex;

              return (
                <div
                  key={item.day}
                  className={`relative rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between transition-all min-h-[160px] sm:min-h-[175px] ${
                    isAvailable
                      ? 'bg-gradient-to-b from-[#2A162B] to-[#1C1424] border-2 border-kaos-pink shadow-[0_0_24px_rgba(255,0,127,0.35)] scale-[1.02] z-10'
                      : item.isMilestone
                      ? 'bg-gradient-to-b from-[#282116] to-[#181512] border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : isClaimed
                      ? 'bg-[#14121A]/80 border border-emerald-500/30 opacity-80'
                      : 'bg-[#14131A] border border-[#262330] opacity-75'
                  }`}
                >
                  {/* Floating Header Badges */}
                  {isAvailable && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-kaos-pink text-white text-[9px] font-mono font-black uppercase tracking-wider shadow-md shadow-kaos-pink/40 animate-pulse">
                      TODAY
                    </div>
                  )}

                  {item.isMilestone && !isAvailable && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-mono font-black uppercase tracking-wider shadow-md shadow-amber-500/30">
                      MILESTONE
                    </div>
                  )}

                  {/* Day Number */}
                  <div className="text-center pt-1">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isAvailable
                          ? 'text-kaos-pink'
                          : item.isMilestone
                          ? 'text-amber-400'
                          : isClaimed
                          ? 'text-emerald-400'
                          : 'text-zinc-500'
                      }`}
                    >
                      DAY {String(item.day).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Icon & Reward Details */}
                  <div className="text-center my-auto py-1 space-y-1">
                    <div className="flex items-center justify-center h-10">
                      {item.icon === 'key' ? (
                        <span className="text-2xl">🗝️</span>
                      ) : item.icon === 'radar' ? (
                        <span className="text-2xl">📡</span>
                      ) : item.icon === 'bolt' ? (
                        <span className="text-2xl">⚡</span>
                      ) : item.icon === 'menu_book' ? (
                        <span className="text-2xl">📜</span>
                      ) : item.icon === 'lock_open' ? (
                        <span className="text-2xl">🔐</span>
                      ) : (
                        <span className="text-2xl">✨</span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-white truncate leading-tight">{item.title}</p>
                    <p
                      className={`text-[10px] font-mono font-semibold ${
                        isAvailable ? 'text-amber-300' : 'text-zinc-400'
                      }`}
                    >
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Action / Status Pill */}
                  <div className="pt-1.5">
                    {isClaimed ? (
                      <div className="w-full py-1.5 rounded-xl border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold flex items-center justify-center gap-1 bg-emerald-500/10">
                        <span>✓ CLAIMED</span>
                      </div>
                    ) : isAvailable ? (
                      <div className="relative w-full">
                        <span className="absolute -inset-0.5 rounded-xl bg-kaos-pink/40 animate-ping opacity-60 pointer-events-none" />
                        <button
                          type="button"
                          onClick={handleClaim}
                          disabled={isClaiming}
                          className="relative w-full py-1.5 rounded-xl bg-gradient-to-r from-kaos-pink to-kaos-purple hover:brightness-115 text-white text-[10px] font-bold tracking-tight shadow-md shadow-kaos-pink/40 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
                        >
                          {isClaiming ? (
                            <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                          ) : (
                            <span>CLAIM NOW</span>
                          )}
                        </button>
                      </div>
                    ) : isTomorrow ? (
                      <div className="w-full py-1.5 rounded-xl border border-zinc-700/60 text-zinc-400 text-[10px] font-mono font-medium flex items-center justify-center bg-[#181620]">
                        <span>TOMORROW</span>
                      </div>
                    ) : item.isMilestone ? (
                      <div className="w-full py-1.5 rounded-xl border border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold flex items-center justify-center bg-amber-500/10">
                        <span>SPECIAL</span>
                      </div>
                    ) : (
                      <div className="w-full py-1.5 rounded-xl border border-zinc-800 text-zinc-500 text-[10px] font-mono flex items-center justify-center gap-1 bg-[#121118]">
                        <span className="material-symbols-outlined text-[11px]">lock</span>
                        <span>LOCKED</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. 30-Day Expedition Milestone Panel */}
        <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-[#14121C] border border-[#2A2736] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-kaos-teal uppercase tracking-widest">
                30-DAY EXPEDITION MILESTONE
              </span>
            </div>
            <span className="text-xs font-mono text-kaos-teal font-extrabold">
              {rewardsState.totalDaysSynchronized} / 30 Days Synchronized ({percent30}%)
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Grand Archaeo-Vault Mystery Chest
              </h4>
              <span className="px-2 py-0.2 rounded bg-kaos-purple/20 border border-kaos-purple/40 text-kaos-purple text-[9px] font-mono font-bold">
                Tier V
              </span>
            </div>
          </div>

          {/* Progress Bar with milestone ticks */}
          <div className="space-y-1.5">
            <div className="w-full h-2.5 rounded-full bg-[#1A1824] overflow-hidden border border-[#2E2B3C] relative">
              <div
                className="h-full bg-gradient-to-r from-kaos-pink via-kaos-purple to-kaos-teal rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${percent30}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-zinc-500 px-0.5">
              <span>Day 7</span>
              <span>Day 14</span>
              <span>Day 21</span>
              <span className="text-amber-400 font-bold">★ Day 30</span>
            </div>
          </div>

          {/* Grand Milestone Reward Preview Card */}
          <div className="p-3.5 rounded-xl bg-[#1A1824] border border-[#2E2B3A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-kaos-teal/15 border border-kaos-teal/30 flex items-center justify-center text-xl shrink-0">
                💎
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Epoch Pioneer Relic Bundle</p>
                <p className="text-[10px] text-zinc-400 font-mono truncate">
                  +2,500 XP • Exclusive Hologram Title: <span className="text-kaos-teal font-semibold">"Epoch Pioneer"</span>
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {rewardsState.milestone30Claimed ? (
                <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                  ✓ CLAIMED
                </span>
              ) : rewardsState.totalDaysSynchronized >= 30 ? (
                <button
                  type="button"
                  onClick={handleClaimMilestone}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#F05423] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  CLAIM REWARD
                </button>
              ) : (
                <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
                  UNLOCKS AT 30 DAYS
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 5. Footer */}
        <div className="mt-6 pt-4 border-t border-[#23202C] flex items-center justify-between text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-zinc-400">Kaos Cadence v2.4 Active</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1A1822] hover:bg-[#282434] border border-[#2E2B38] text-zinc-300 hover:text-white font-semibold cursor-pointer transition-colors"
          >
            Dismiss
          </button>
        </div>

        {/* Claim Celebration Modal Overlay */}
        <AnimatePresence>
          {claimCelebration.isOpen && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="bg-[#1C1A24] border border-kaos-pink/60 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-[0_0_50px_rgba(255,0,127,0.4)]"
              >
                <div className="w-16 h-16 rounded-3xl bg-kaos-pink/20 border border-kaos-pink/50 mx-auto flex items-center justify-center text-3xl shadow-lg">
                  🎉
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-kaos-pink font-extrabold tracking-widest">
                    REWARD SYNCHRONIZED
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">
                    {claimCelebration.reward?.title}
                  </h3>
                  <p className="text-sm font-mono text-amber-400 font-bold mt-1">
                    +{claimCelebration.xpEarned} XP Awarded
                  </p>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Cadet streak maintained! Your tactical cache and expedition progress have been saved.
                </p>

                <button
                  type="button"
                  onClick={() => setClaimCelebration({ isOpen: false, xpEarned: 0 })}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-kaos-pink to-kaos-purple text-white font-bold text-xs shadow-lg shadow-kaos-pink/30 cursor-pointer hover:brightness-110 active:scale-98 transition-all"
                >
                  Continue Expeditions
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DailyRewardsModal;
