import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityFeedItem } from '../types';
import { subscribeToActivityFeed } from '../services/activityService';

export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToActivityFeed(setActivities);
    return () => unsubscribe();
  }, []);

  const getActionIcon = (type: ActivityFeedItem['actionType']) => {
    switch (type) {
      case 'check_in': return 'location_on';
      case 'quest_completion': return 'military_tech';
      case 'discovery': return 'visibility';
      default: return 'sensors';
    }
  };

  const getActionColor = (type: ActivityFeedItem['actionType']) => {
    switch (type) {
      case 'check_in': return 'text-kaos-teal';
      case 'quest_completion': return 'text-kaos-pink';
      case 'discovery': return 'text-kaos-purple';
      default: return 'text-kaos-offwhite';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'JUST NOW';
    if (diffMins < 60) return `${diffMins}M AGO`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}H AGO`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();
  };

  return (
    <div className="bg-surface-secondary/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-kaos-teal text-lg animate-pulse">sensors</span>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-kaos-offwhite">Live Grid Activity</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-kaos-teal shadow-[0_0_8px_#2DD4BF]"></span>
          <span className="text-[8px] font-black uppercase tracking-widest text-kaos-teal opacity-80">Online</span>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto scrollbar-none p-2 space-y-2">
        <AnimatePresence mode="popLayout">
          {activities.length === 0 ? (
            <div className="py-12 text-center opacity-20">
              <span className="material-symbols-outlined text-4xl mb-2">radar</span>
              <p className="text-[10px] font-bold uppercase tracking-widest">Scanning frequencies...</p>
            </div>
          ) : (
            activities.map((activity) => (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center gap-3"
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-kaos-navy flex items-center justify-center text-lg border border-white/10 shadow-inner overflow-hidden">
                    {activity.explorerAvatar ? (
                      <img src={activity.explorerAvatar} alt={activity.explorerName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-white/20">person</span>
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background-primary border border-white/10 flex items-center justify-center shadow-lg`}>
                    <span className={`material-symbols-outlined text-[12px] font-black ${getActionColor(activity.actionType)}`}>
                      {getActionIcon(activity.actionType)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-black text-kaos-offwhite truncate uppercase">{activity.explorerName}</span>
                    <span className="text-[8px] font-bold text-text-secondary opacity-40 uppercase tabular-nums">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-tight line-clamp-1">
                    {activity.actionType === 'check_in' && (
                      <>Checked in at <span className="text-kaos-teal font-bold">{activity.locationName}</span></>
                    )}
                    {activity.actionType === 'quest_completion' && (
                      <>Completed <span className="text-kaos-pink font-bold">{activity.locationName}</span></>
                    )}
                    {activity.actionType === 'discovery' && (
                      <>Discovered <span className="text-kaos-purple font-bold">{activity.locationName}</span></>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {activity.zone && (
                      <span className="text-[8px] font-black text-kaos-teal/60 bg-kaos-teal/5 px-1.5 py-0.5 rounded border border-kaos-teal/10 uppercase tracking-widest">
                        {activity.zone}
                      </span>
                    )}
                    <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse"></span>
                      +{activity.xpGained} XP
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      
      <div className="p-3 bg-white/5 border-t border-white/5 text-center">
        <button className="text-[9px] font-black uppercase tracking-[0.2em] text-text-secondary hover:text-kaos-offwhite transition-colors">
          View World Logs
        </button>
      </div>
    </div>
  );
};
