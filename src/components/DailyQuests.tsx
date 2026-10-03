import React, { useState, useEffect } from 'react';
import { sqlDb, DailyQuest } from '../lib/sqlDatabase';
import { KAOS_SPOTS } from '../data/kaosData';
import { MasterSpot } from '../types';

import { logActivity } from '../services/activityService';
import { auth } from '../lib/firebase';

interface DailyQuestsProps {
  onAwardXp: (amount: number, reason: string) => void;
  onSpotSelected: (spot: MasterSpot) => void;
  onShowToast?: (msg: string) => void;
}

export const DailyQuests: React.FC<DailyQuestsProps> = ({
  onAwardXp,
  onSpotSelected,
  onShowToast,
}) => {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rerolling, setRerolling] = useState(false);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = (forceNew: boolean = false) => {
    try {
      const data = sqlDb.getDailyQuests(forceNew);
      setQuests(data);
    } catch (e) {
      console.error('Failed to load daily quests from SQL:', e);
    } finally {
      setLoading(false);
      setRerolling(false);
    }
  };

  const handleReroll = () => {
    setRerolling(true);
    setTimeout(() => {
      loadQuests(true);
      if (onShowToast) {
        onShowToast('3 new random objectives generated from SQL database! 🎲');
      }
    }, 250);
  };

  const handleCompleteQuest = (quest: DailyQuest) => {
    if (quest.isCompleted) return;

    const result = sqlDb.completeDailyQuest(quest.id);
    if (result.success) {
      // Award XP directly into the application's central XP state
      onAwardXp(result.xpAwarded, result.questTitle);

      // Log to global activity feed
      logActivity({
        explorerId: auth.currentUser?.uid || 'anonymous',
        explorerName: auth.currentUser?.displayName || 'Explorer',
        actionType: 'quest_completion',
        locationName: quest.title,
        zone: quest.zone,
        xpGained: result.xpAwarded
      });

      // Refresh quests from SQL table
      setQuests((prev) =>
        prev.map((q) =>
          q.id === quest.id
            ? { ...q, isCompleted: true, claimedAt: new Date().toISOString() }
            : q
        )
      );
    }
  };

  const handleInspectTargetSpot = (targetSpotId?: string) => {
    if (!targetSpotId) return;
    const spot = KAOS_SPOTS.find((s) => s.id === targetSpotId);
    if (spot) {
      onSpotSelected(spot);
    }
  };

  const completedCount = quests.filter((q) => q.isCompleted).length;
  const totalXpAvailable = quests.reduce((acc, q) => acc + q.xpReward, 0);
  const totalXpEarned = quests
    .filter((q) => q.isCompleted)
    .reduce((acc, q) => acc + q.xpReward, 0);

  if (loading) {
    return (
      <div className="p-6 rounded-3xl bg-[#1C1A1F] border border-[#26242C] animate-pulse text-center text-xs text-zinc-500 font-mono">
        Loading exploration objectives from SQL database...
      </div>
    );
  }

  return (
    <div className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header with Progress & Reroll Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#26242C] pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F05423] text-xl">military_tech</span>
            <h3 className="text-base font-bold text-white tracking-tight">Daily Exploration Quests</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">
              SQL: daily_quests
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            3 randomized daily objectives pulled directly from offline relational database
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress Pill */}
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-zinc-300">
              {completedCount} / {quests.length} Completed
            </span>
            <div className="text-[11px] font-mono text-emerald-400 font-bold">
              +{totalXpEarned} / +{totalXpAvailable} XP
            </div>
          </div>

          {/* Reroll Button */}
          <button
            onClick={handleReroll}
            disabled={rerolling}
            className="px-3 py-1.5 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-400 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            title="Roll 3 new exploration objectives from SQL spots and perks"
          >
            <span className={`material-symbols-outlined text-sm ${rerolling ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span className="hidden sm:inline">Reroll SQL</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#121114] rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-[#F05423] to-emerald-400 h-full transition-all duration-500"
          style={{ width: `${quests.length > 0 ? (completedCount / quests.length) * 100 : 0}%` }}
        />
      </div>

      {/* 3 Quest Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {quests.map((quest) => {
          const hasLinkedSpot = Boolean(
            quest.targetSpotId && KAOS_SPOTS.some((s) => s.id === quest.targetSpotId)
          );

          return (
            <div
              key={quest.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                quest.isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-[#121114] border-[#26242C] hover:border-zinc-700'
              }`}
            >
              {quest.isCompleted && (
                <div className="absolute top-2 right-2 text-emerald-400 flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  <span>CLAIMED</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      quest.isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-[#F05423]/20 text-[#F05423]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{quest.icon}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono font-semibold text-zinc-500 block leading-tight">
                      {quest.zone} · {quest.category}
                    </span>
                    <h4 className="text-xs font-bold text-white tracking-tight leading-tight line-clamp-1">
                      {quest.title}
                    </h4>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                  {quest.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#26242C]/60 flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-[#F05423] tabular-nums">
                  +{quest.xpReward} XP
                </span>

                <div className="flex items-center gap-1.5">
                  {hasLinkedSpot && !quest.isCompleted && (
                    <button
                      onClick={() => handleInspectTargetSpot(quest.targetSpotId)}
                      className="px-2 py-1 rounded-lg bg-[#1C1A1F] hover:bg-[#26242C] border border-[#26242C] text-zinc-400 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                      title="Inspect target landmark dossier"
                    >
                      Dossier
                    </button>
                  )}

                  <button
                    onClick={() => handleCompleteQuest(quest)}
                    disabled={quest.isCompleted}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      quest.isCompleted
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : 'bg-gradient-to-r from-[#F05423] to-[#FF8A00] hover:from-[#ff6a38] hover:to-[#ffa033] text-white shadow-md shadow-[#F05423]/20'
                    }`}
                  >
                    {quest.isCompleted ? (
                      <>
                        <span className="material-symbols-outlined text-xs">done</span>
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <span>Complete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default DailyQuests;
