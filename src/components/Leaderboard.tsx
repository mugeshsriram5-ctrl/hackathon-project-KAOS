import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sqlDb, GlobalExplorer } from '../lib/sqlDatabase';

export const Leaderboard: React.FC = () => {
  const [explorers, setExplorers] = useState<GlobalExplorer[]>([]);
  const [activeZone, setActiveZone] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const zones = ['All', 'Mylapore', 'George Town', 'Chepauk', 'Triplicane', 'Fort St. George'];

  useEffect(() => {
    const loadLeaderboard = () => {
      setLoading(true);
      // Small delay to simulate "syncing with the grid"
      setTimeout(() => {
        const data = sqlDb.getGlobalExplorers(20, activeZone);
        setExplorers(data);
        setLoading(false);
      }, 400);
    };

    loadLeaderboard();

    // Listen for SQL sync events (XP updates)
    const handleSync = () => loadLeaderboard();
    window.addEventListener('kaos-sql-sync-change', handleSync);
    return () => window.removeEventListener('kaos-sql-sync-change', handleSync);
  }, [activeZone]);

  return (
    <div className="flex flex-col h-full bg-background-primary overflow-hidden">
      {/* Zone Filter Header */}
      <div className="flex items-center gap-2 overflow-x-auto p-4 py-3 border-b border-white/5 scrollbar-none bg-surface-primary/30">
        {zones.map((zone) => (
          <button
            key={zone}
            onClick={() => setActiveZone(zone)}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer ${
              activeZone === zone
                ? 'bg-kaos-purple text-white shadow-lg shadow-kaos-purple/20'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 scrollbar-none">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="w-8 h-8 border-2 border-kaos-purple/20 border-t-kaos-purple rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-kaos-purple uppercase tracking-[0.2em] animate-pulse">Syncing Grid Ranks...</p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2.5"
            >
              {explorers.map((explorer, index) => (
                <motion.div
                  key={explorer.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`relative p-4 rounded-3xl border transition-all flex items-center gap-4 ${
                    explorer.isCurrentUser
                      ? 'bg-gradient-to-r from-kaos-purple/20 to-kaos-pink/10 border-kaos-purple/50 shadow-lg shadow-kaos-purple/10 scale-[1.02] z-10'
                      : 'bg-surface-secondary/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Rank Indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                    explorer.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-kaos-navy' :
                    explorer.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-kaos-navy' :
                    explorer.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-800 text-kaos-navy' :
                    'bg-kaos-navy text-text-secondary border border-white/10'
                  }`}>
                    {explorer.rank}
                  </div>

                  {/* Avatar */}
                  <div className="text-2xl shrink-0 w-10 h-10 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5">
                    {explorer.avatar}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-white truncate uppercase tracking-tight">
                        {explorer.username}
                      </h4>
                      {explorer.isCurrentUser && (
                        <span className="text-[8px] bg-kaos-purple text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">YOU</span>
                      )}
                    </div>
                    <p className="text-[9px] text-text-secondary font-bold uppercase tracking-widest opacity-60">
                      {explorer.title}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1 mb-0.5">
                      <span className="text-[11px] font-black text-kaos-teal tracking-tight">{explorer.xp.toLocaleString()}</span>
                      <span className="text-[9px] font-black text-kaos-teal/50 uppercase tracking-tighter">XP</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <span className="material-symbols-outlined text-[10px] text-orange-400 font-black">local_fire_department</span>
                      <span className="text-[10px] font-black text-orange-400 tracking-tight">{explorer.streak}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistence Note */}
      <div className="p-4 pt-0 text-center">
        <p className="text-[9px] font-bold text-text-secondary opacity-40 uppercase tracking-[0.2em]">Data Synced with Offline SQL Cache</p>
      </div>
    </div>
  );
};
