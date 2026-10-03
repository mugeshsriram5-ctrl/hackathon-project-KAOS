import React, { useState, useEffect } from 'react';
import { sqlDb, GlobalExplorer } from '../lib/sqlDatabase';

interface GlobalExplorersProps {
  onShowToast: (msg: string) => void;
}

export const GlobalExplorers: React.FC<GlobalExplorersProps> = ({ onShowToast }) => {
  const [explorers, setExplorers] = useState<GlobalExplorer[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const zones = ['All', 'Mylapore', 'George Town', 'Chepauk', 'Triplicane'];

  useEffect(() => {
    loadLeaderboard();
  }, [selectedZone]);

  const loadLeaderboard = () => {
    try {
      const data = sqlDb.getGlobalExplorers(10, selectedZone);
      setExplorers(data);
    } catch (err) {
      console.error('Failed to load global explorers from SQL:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black font-extrabold text-xs flex items-center justify-center shadow-md shadow-amber-500/30">
          1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-slate-300 to-zinc-400 text-black font-extrabold text-xs flex items-center justify-center shadow-md shadow-slate-400/20">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-700 to-orange-500 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-orange-600/20">
          3
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-xl bg-[#121114] border border-[#26242C] text-zinc-400 font-mono font-bold text-xs flex items-center justify-center">
        {rank}
      </div>
    );
  };

  return (
    <div className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
      {/* Header and Squad Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#26242C] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F05423] text-xl">groups</span>
            <h3 className="text-base font-bold text-white tracking-tight">Squad & Global Leaderboard</h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#F05423]/10 text-[#F05423] border border-[#F05423]/25 font-bold">
              ACTIVE SQUAD: #COROMANDEL_CREW
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Real-time explorer squad rankings and regional XP leadership board
          </p>
        </div>

        {/* View Mode & Zone Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-[#121114] border border-[#26242C] rounded-xl">
            <button
              onClick={() => setSelectedZone('All')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedZone === 'All' ? 'bg-[#F05423] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Explorers
            </button>
            <button
              onClick={() => setSelectedZone('Squads')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedZone === 'Squads' ? 'bg-[#F05423] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Squad Rankings
            </button>
          </div>

          <button
            onClick={() => onShowToast('Create Squad Modal opened! Form your squad now. 🛡️')}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F05423] to-[#FF8A00] text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer hover:opacity-95 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">group_add</span>
            <span>Create Squad</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table / Rows */}
      {loading ? (
        <div className="p-8 text-center text-xs text-zinc-500 font-mono animate-pulse">
          Syncing top 10 group rankings...
        </div>
      ) : explorers.length === 0 ? (
        <div className="p-8 text-center text-xs text-zinc-400 font-mono">
          No explorers recorded for {selectedZone} sector yet.
        </div>
      ) : (
        <div className="space-y-2">
          {explorers.map((explorer) => {
            const isTop3 = explorer.rank <= 3;
            return (
              <div
                key={explorer.id}
                onClick={() =>
                  onShowToast(
                    `${explorer.username} · #${explorer.rank} in Global Rankings (${explorer.xp.toLocaleString()} XP)`
                  )
                }
                className={`p-3.5 sm:px-4 sm:py-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                  explorer.isCurrentUser
                    ? 'bg-gradient-to-r from-[#F05423]/15 via-[#1C1A1F] to-emerald-950/20 border-[#F05423]/50 shadow-md shadow-[#F05423]/10'
                    : isTop3
                    ? 'bg-[#151318] border-[#26242C] hover:border-zinc-700'
                    : 'bg-[#121114] border-[#26242C]/60 hover:border-zinc-700'
                }`}
              >
                {/* Left Side: Rank, Avatar, Name & Title */}
                <div className="flex items-center gap-3 min-w-0">
                  {getRankBadge(explorer.rank)}

                  <div className="w-9 h-9 rounded-xl bg-[#1C1A1F] border border-[#26242C] flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                    {explorer.avatar}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white truncate group-hover:text-[#F05423] transition-colors">
                        {explorer.username}
                      </span>
                      {explorer.isCurrentUser && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#F05423] text-white">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span className="truncate">{explorer.title}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-500 font-mono">{explorer.zone}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Streak & XP */}
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                    <span>🔥</span>
                    <span className="font-mono font-semibold tabular-nums">{explorer.streak}d</span>
                  </div>

                  <div className="min-w-[80px]">
                    <div className="text-xs font-bold font-mono text-white tabular-nums">
                      {explorer.xp.toLocaleString()}{' '}
                      <span className="text-[10px] text-[#F05423] font-sans">XP</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono block">
                      Level {Math.floor(explorer.xp / 300) + 1}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Query Proof Footer */}
      <div className="pt-2 border-t border-[#26242C] flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono text-zinc-500 gap-2">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px] text-cyan-400">terminal</span>
          <span className="truncate">
            SELECT username, xp, streak FROM global_explorers ORDER BY xp DESC LIMIT 10
          </span>
        </div>
        <span className="text-emerald-400 font-semibold shrink-0">Live SQL Synchronized</span>
      </div>
    </div>
  );
};

export default GlobalExplorers;
