import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MasterSpot } from '../types';
import { KAOS_SPOTS } from '../data/kaosData';
import { MobileBottomSheet } from '../components/MobileBottomSheet';
import { KaosAppIcon } from '../components/KaosAppIcon';
import {
  DailyRewardsState,
  getSecondsUntilMidnight,
  formatCountdown,
  getInitialRewardsState,
} from '../services/dailyRewardsService';

interface HomeScreenProps {
  onShowToast: (msg: string) => void;
  onNavigateTab: (tab: 'explore' | 'map' | 'assistant' | 'friends' | 'profile') => void;
  onSelectSpot: (spot: MasterSpot) => void;
  onStartQuest: (quest: any) => void;
  onOpenNotifications: () => void;
  onOpenDailyRewards?: () => void;
  rewardsState?: DailyRewardsState;
  unreadNotificationsCount?: number;
  userLevel?: number;
  userXp?: number;
  userName?: string;
  userAvatar?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onShowToast,
  onNavigateTab,
  onSelectSpot,
  onStartQuest,
  onOpenNotifications,
  onOpenDailyRewards,
  rewardsState: propsRewardsState,
  unreadNotificationsCount = 2,
  userLevel = 12,
  userXp = 3400,
  userName = 'Usha Baskar',
  userAvatar = '🛡️',
}) => {
  const [selectedSpotForSheet, setSelectedSpotForSheet] = useState<MasterSpot | null>(null);
  const [localRewardsState, setLocalRewardsState] = useState<DailyRewardsState>(() => propsRewardsState || getInitialRewardsState());
  const [countdownSeconds, setCountdownSeconds] = useState<number>(getSecondsUntilMidnight);

  // Sync props or local events
  useEffect(() => {
    if (propsRewardsState) {
      setLocalRewardsState(propsRewardsState);
    }
  }, [propsRewardsState]);

  useEffect(() => {
    const handleRewardsUpdate = (e: any) => {
      if (e?.detail) {
        setLocalRewardsState(e.detail);
      }
    };
    window.addEventListener('kaos-daily-rewards-updated', handleRewardsUpdate);
    return () => window.removeEventListener('kaos-daily-rewards-updated', handleRewardsUpdate);
  }, []);

  // Live timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds(getSecondsUntilMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeRewardsState = propsRewardsState || localRewardsState;
  const isRewardReady = activeRewardsState.isClaimableToday;

  // Featured Daily Hero Quest
  const featuredQuest = {
    id: 'hero-quest-1',
    title: 'Mylapore Sacred Geometry & Tank Alignment',
    zone: 'Mylapore',
    difficulty: 'Moderate',
    xpReward: 350,
    estimatedMins: 30,
    description: 'Decipher 7th-century acoustic gopuram shadows at Kapaleeshwarar temple tank before the evening aarti.',
    spot: KAOS_SPOTS[0],
  };

  // Recent in-progress exploration spots
  const continueSpots = [KAOS_SPOTS[0], KAOS_SPOTS[1]];
  // Recommended spots
  const recommendedSpots = [KAOS_SPOTS[2], KAOS_SPOTS[3] || KAOS_SPOTS[0]];

  const nextLevelXp = (userLevel + 1) * 300;
  const currentLevelMinXp = userLevel * 300;
  const xpInCurrentLevel = Math.max(0, userXp - currentLevelMinXp);
  const xpNeeded = 300;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeeded) * 100));

  return (
    <div className="space-y-6 pb-24 p-4 md:p-8 max-w-xl mx-auto md:max-w-4xl font-sans">
      {/* 1. Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => onNavigateTab('profile')}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1C1A1F] to-[#26242C] border border-white/10 flex items-center justify-center text-2xl shadow-md shrink-0 cursor-pointer overflow-hidden"
              aria-label="View profile"
            >
              {userAvatar}
            </button>
            <div className="absolute -bottom-1 -right-1 pointer-events-none">
              <KaosAppIcon size={18} withGlow={false} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <KaosAppIcon size={14} withGlow={false} />
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                KAOS Grid • Vanakkam
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight leading-none mt-0.5">
              {userName}
            </h2>
          </div>
        </div>

        <button
          onClick={onOpenNotifications}
          className="relative w-10 h-10 rounded-2xl bg-[#1C1A1F] border border-[#26242C] hover:border-[#F05423]/50 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-all shadow-sm"
          title="Notifications"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F05423] text-white text-[9px] font-mono font-bold flex items-center justify-center">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. Main Hero Quest Card (Prominent & Actionable) */}
      <div className="bg-gradient-to-br from-[#1C1A1F] via-[#241F28] to-[#121114] border border-[#F05423]/40 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#F05423]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <span className="px-3 py-1 rounded-full bg-[#F05423]/20 border border-[#F05423]/40 text-[#F05423] text-[10px] font-mono font-extrabold uppercase tracking-wider">
            Featured Quest • {featuredQuest.zone}
          </span>
          <span className="text-amber-400 font-extrabold text-xs font-mono bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            +{featuredQuest.xpReward} XP
          </span>
        </div>

        <div className="space-y-1.5 relative z-10">
          <h3 className="text-lg md:text-xl font-black text-white tracking-tight leading-snug">
            {featuredQuest.title}
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {featuredQuest.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#26242C]/80 relative z-10">
          <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
            <span>⏱️ {featuredQuest.estimatedMins} mins</span>
            <span>⚡ {featuredQuest.difficulty}</span>
          </div>

          <button
            onClick={() => onStartQuest(featuredQuest)}
            className="px-5 py-2.5 rounded-2xl bg-[#F05423] hover:bg-[#ff6a38] text-white font-extrabold text-xs cursor-pointer transition-all shadow-lg shadow-[#F05423]/30 flex items-center gap-1.5"
          >
            <span>Start Quest</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* 3. Continue Exploring Carousel (Continue Discovery) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase text-zinc-400 font-bold tracking-wider">
            Continue Exploring
          </h3>
          <button
            onClick={() => onNavigateTab('explore')}
            className="text-[11px] text-[#F05423] font-bold hover:underline cursor-pointer"
          >
            View Map →
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
          {continueSpots.map((spot) => (
            <div
              key={spot.id}
              onClick={() => setSelectedSpotForSheet(spot)}
              className="snap-start shrink-0 w-64 bg-[#1C1A1F] border border-[#26242C] hover:border-[#F05423]/40 rounded-2xl p-3.5 space-y-2 cursor-pointer transition-all shadow-lg"
            >
              <div className="relative h-28 rounded-xl overflow-hidden bg-[#121114]">
                <img
                  src={spot.imageUrl}
                  alt={spot.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[9px] font-mono font-bold text-amber-400">
                  +{spot.xp} XP
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white truncate">{spot.title}</h4>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{spot.zone} • {spot.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DAILY REWARDS (MANDATORY PLACEMENT: DIRECTLY BELOW CONTINUE DISCOVERY) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🎁</span>
            <h3 className="text-xs font-mono uppercase text-zinc-400 font-bold tracking-wider">
              DAILY REWARDS
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            Cadence v2.4
          </span>
        </div>

        <motion.div
          onClick={onOpenDailyRewards}
          initial={{
            scale: 1,
            y: 0,
            borderColor: isRewardReady ? 'rgba(255, 0, 127, 0.6)' : 'rgba(42, 39, 54, 0.9)',
            boxShadow: isRewardReady
              ? '0 0 25px rgba(255, 0, 127, 0.22), 0 10px 30px rgba(0, 0, 0, 0.4)'
              : '0 10px 25px rgba(0, 0, 0, 0.3)',
          }}
          whileHover={{
            scale: 1.015,
            y: -2,
            borderColor: 'rgba(20, 255, 236, 0.85)',
            boxShadow:
              '0 0 30px rgba(20, 255, 236, 0.35), 0 0 60px rgba(20, 255, 236, 0.15), inset 0 0 20px rgba(20, 255, 236, 0.08)',
            transition: { duration: 0.25, ease: 'easeOut' },
          }}
          whileTap={{
            scale: 0.985,
            y: 0,
            transition: { duration: 0.1 },
          }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-xl relative overflow-hidden group select-none ${
            isRewardReady
              ? 'bg-gradient-to-br from-[#27142E] via-[#1D1326] to-[#121018]'
              : 'bg-gradient-to-br from-[#1C1A22] to-[#14121A]'
          }`}
          role="button"
          tabIndex={0}
          aria-label="Open Daily Rewards Calendar"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenDailyRewards?.();
            }
          }}
        >
          {/* Subtle top cyan holographic horizon line on hover */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#14FFEC] to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />

          {/* Subtle animated neon ambient glow for ready reward */}
          {isRewardReady && (
            <>
              <motion.div
                animate={{
                  opacity: [0.35, 0.65, 0.35],
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute -top-12 -right-12 w-48 h-48 bg-kaos-pink/20 rounded-full blur-3xl pointer-events-none"
              />
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-kaos-pink to-transparent opacity-80 animate-pulse" />
            </>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <motion.div
                animate={
                  isRewardReady
                    ? {
                        scale: [1, 1.06, 1],
                        rotate: [0, -2, 2, 0],
                      }
                    : {}
                }
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`w-13 h-13 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-md border ${
                  isRewardReady
                    ? 'bg-gradient-to-tr from-kaos-pink/35 to-amber-500/20 border-kaos-pink/60 text-white shadow-kaos-pink/30'
                    : 'bg-[#15131E] border-[#2E2B3C] text-emerald-400'
                }`}
              >
                {isRewardReady ? '🔥' : '✓'}
              </motion.div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-white tracking-tight">
                    {isRewardReady
                      ? activeRewardsState.totalDaysSynchronized === 0
                        ? 'DAY 1 REWARD AVAILABLE'
                        : `🔥 DAY ${activeRewardsState.todayDayIndex} STREAK`
                      : `✓ DAY ${activeRewardsState.todayDayIndex} COMPLETE`}
                  </span>

                  {isRewardReady ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-kaos-pink text-white text-[9px] font-mono font-black uppercase tracking-wider animate-pulse shadow-md shadow-kaos-pink/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>READY</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold border border-emerald-500/30">
                      SYNCHRONIZED
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400">
                  {isRewardReady
                    ? "Today's cadence reward is ready. Claim now to boost XP & keys."
                    : `Next reward in: `}
                  {!isRewardReady && (
                    <span className="font-mono text-kaos-teal font-bold ml-1">
                      {formatCountdown(countdownSeconds)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
              {isRewardReady ? (
                <div className="relative">
                  {/* Radial notification ping wave */}
                  <span className="absolute -inset-1 rounded-2xl bg-kaos-pink/40 animate-ping opacity-60 pointer-events-none" />
                  <span className="absolute -inset-2 rounded-2xl bg-kaos-purple/20 animate-pulse blur-xs pointer-events-none" />

                  <div className="relative px-4 py-2.5 rounded-xl bg-gradient-to-r from-kaos-pink via-[#e02874] to-kaos-purple group-hover:brightness-115 text-white font-bold text-xs tracking-tight shadow-lg shadow-kaos-pink/40 flex items-center gap-1.5 transition-all">
                    <span>CLAIM NOW</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-[#14121A] border border-[#2E2B3A] group-hover:border-kaos-teal/50 text-zinc-300 group-hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all">
                  <span>VIEW CALENDAR</span>
                  <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">
                    calendar_month
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 4. Discover Something New */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase text-zinc-400 font-bold tracking-wider">
          Discover Something New
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommendedSpots.map((spot) => (
            <div
              key={spot.id}
              onClick={() => setSelectedSpotForSheet(spot)}
              className="p-3.5 rounded-2xl bg-[#1C1A1F] border border-[#26242C] hover:border-[#F05423]/40 transition-all flex items-center gap-3 cursor-pointer shadow-md"
            >
              <img
                src={spot.imageUrl}
                alt={spot.title}
                className="w-14 h-14 rounded-xl object-cover border border-[#26242C] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate">{spot.title}</h4>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">{spot.zone} • {spot.category}</p>
                <span className="text-[9px] font-mono text-[#F05423] font-bold mt-1 inline-block">
                  +{spot.xp} XP Available
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Compact Level & XP Progress */}
      <div className="bg-[#1C1A1F] border border-[#26242C] rounded-2xl p-4 space-y-2 shadow-md">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#F05423] text-sm">workspace_premium</span>
            <span>Level {userLevel} Cartographer</span>
          </span>
          <span className="font-mono text-zinc-400 text-[11px]">
            {userXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#121114] overflow-hidden border border-[#26242C]">
          <div
            className="h-full bg-gradient-to-r from-[#F05423] to-amber-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 6. Friends Activity Snapshot */}
      <div className="bg-[#1C1A1F] border border-[#26242C] rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase text-zinc-400 font-bold tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-emerald-400 text-sm">groups</span>
            <span>Squad Activity</span>
          </h3>
          <button
            onClick={() => onNavigateTab('friends')}
            className="text-[11px] text-[#F05423] font-bold hover:underline cursor-pointer"
          >
            Find Friends →
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#121114] border border-[#26242C] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1C1A1F] border border-[#26242C] flex items-center justify-center text-lg shrink-0">
            🏛️
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white font-bold truncate">Priya Raj</p>
            <p className="text-[10px] text-zinc-400 truncate">Unlocked <span className="text-amber-400">Sacred Tank Specialist</span> badge</p>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 shrink-0">1h ago</span>
        </div>
      </div>

      {/* 7. AI Companion Quick Entry Point */}
      <div
        onClick={() => onNavigateTab('assistant')}
        className="p-4 rounded-2xl bg-gradient-to-r from-[#F05423]/15 via-[#1C1A1F] to-[#1C1A1F] border border-[#F05423]/40 flex items-center justify-between gap-3 cursor-pointer shadow-xl hover:border-[#F05423] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F05423] text-white flex items-center justify-center text-xl shadow-md shadow-[#F05423]/30">
            🤖
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">AI Scout & Heritage Archivist</h4>
            <p className="text-[10px] text-zinc-400">Ask anything about Madras landmarks, hidden inscriptions, or soundscapes</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-zinc-400 text-sm">arrow_forward</span>
      </div>

      {/* Bottom Sheet for Spot Preview */}
      <MobileBottomSheet
        isOpen={!!selectedSpotForSheet}
        onClose={() => setSelectedSpotForSheet(null)}
        title={selectedSpotForSheet?.title || 'Heritage Landmark'}
      >
        {selectedSpotForSheet && (
          <div className="space-y-4">
            <img
              src={selectedSpotForSheet.imageUrl}
              alt={selectedSpotForSheet.title}
              className="w-full h-44 object-cover rounded-2xl border border-[#26242C]"
            />
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#F05423] font-bold">
                {selectedSpotForSheet.zone} • {selectedSpotForSheet.category}
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {selectedSpotForSheet.description}
              </p>
            </div>
            <button
              onClick={() => {
                onSelectSpot(selectedSpotForSheet);
                setSelectedSpotForSheet(null);
              }}
              className="w-full py-3 rounded-xl bg-[#F05423] text-white font-bold text-xs shadow-lg shadow-[#F05423]/25 cursor-pointer"
            >
              Open Complete Spot Dossier
            </button>
          </div>
        )}
      </MobileBottomSheet>
    </div>
  );
};

export default HomeScreen;
