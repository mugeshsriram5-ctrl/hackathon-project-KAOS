import React from 'react';
import { motion } from 'framer-motion';
import { MasterSpot } from '../types';

interface SocialUser {
  id: string;
  displayName: string;
  handle: string;
  avatar: string;
  level: number;
  xp: number;
  badge: string;
  bio: string;
  questsCompleted: number;
  isOnline: boolean;
  role: 'Admin' | 'Member';
}

interface MessagesEmptyStateProps {
  onStartDirectMessage: (user: SocialUser, initialText?: string) => void;
  onOpenFindFriends: () => void;
  onNavigateToGroups: () => void;
  onSelectSpot?: (spot: MasterSpot) => void;
  suggestedUsers: SocialUser[];
  masterSpots?: MasterSpot[];
}

const STARTER_PROMPTS = [
  {
    icon: '☕',
    title: 'Filter Coffee Trail',
    text: 'Hey! Anyone up for tracking vintage peaberry coffee roasters in Triplicane this weekend?',
  },
  {
    icon: '🏛️',
    title: 'Gopuram Acoustics',
    text: 'Found fascinating sound reflections at Kapaleeshwarar tank stepwells. Want to compare notes?',
  },
  {
    icon: '🧭',
    title: 'Colonial Vaults',
    text: 'Deciphering the stained-glass rosette alignment at Senate House. Have you surveyed it yet?',
  },
];

export const MessagesEmptyState: React.FC<MessagesEmptyStateProps> = ({
  onStartDirectMessage,
  onOpenFindFriends,
  onNavigateToGroups,
  suggestedUsers,
  masterSpots = [],
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 overflow-y-auto bg-gradient-to-b from-background-secondary/80 via-surface-primary/95 to-background-primary text-center">
      <div className="max-w-2xl w-full flex flex-col items-center">
        
        {/* Thematic Radar / Beacon Visual */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative mb-6 flex items-center justify-center"
        >
          {/* Animated concentric radar rings */}
          <div className="absolute w-36 h-36 rounded-full border border-kaos-teal/20 animate-ping opacity-25" />
          <div className="absolute w-28 h-28 rounded-full border border-kaos-pink/30 animate-pulse" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-kaos-pink/20 via-surface-secondary to-kaos-teal/20 border border-kaos-pink/30 flex items-center justify-center shadow-xl backdrop-blur-md relative z-10">
            <span className="material-symbols-outlined text-3xl text-kaos-teal">
              satellite_alt
            </span>
          </div>
        </motion.div>

        {/* Heading & Context */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="space-y-2 mb-8"
        >
          <div className="flex items-center justify-center gap-2 text-xs font-mono tracking-widest text-kaos-teal uppercase font-bold">
            <span>Secure Cartographer Frequencies</span>
            <span aria-hidden="true">·</span>
            <span>Channel Ready</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-kaos-offwhite tracking-tight">
            Your Dispatch Center is Quiet
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
            Connect with fellow Chennai explorers to coordinate walking itineraries, trade secret food lore, and verify heritage beacon clues together.
          </p>
        </motion.div>

        {/* Quick Launch Action Tiles */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mb-8"
        >
          <button
            onClick={onOpenFindFriends}
            className="flex items-start gap-3.5 p-4 rounded-2xl bg-surface-primary hover:bg-surface-secondary/70 border border-progress-track hover:border-kaos-teal/40 transition-all text-left group cursor-pointer shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-kaos-teal/10 border border-kaos-teal/20 text-kaos-teal flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-lg">person_search</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-kaos-offwhite group-hover:text-kaos-teal transition-colors">
                Find Explorers by Handle
              </h4>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                Search the city directory by unique surveyor handle to team up.
              </p>
            </div>
          </button>

          <button
            onClick={onNavigateToGroups}
            className="flex items-start gap-3.5 p-4 rounded-2xl bg-surface-primary hover:bg-surface-secondary/70 border border-progress-track hover:border-kaos-purple/40 transition-all text-left group cursor-pointer shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-kaos-purple/10 border border-kaos-purple/20 text-kaos-purple flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-lg">diversity_3</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-kaos-offwhite group-hover:text-kaos-purple transition-colors">
                Join Active Faction Squads
              </h4>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                Collaborate on multi-stage team expeditions across Mylapore and George Town.
              </p>
            </div>
          </button>
        </motion.div>

        {/* Suggested Active Teammates Section */}
        {suggestedUsers.length > 0 && (
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="w-full bg-surface-primary/70 border border-progress-track rounded-3xl p-5 text-left shadow-lg mb-6"
          >
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-progress-track/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-kaos-pink">radar</span>
                <h4 className="text-xs font-bold text-kaos-offwhite uppercase tracking-wider">
                  Available Squad Mates Nearby
                </h4>
              </div>
              <span className="text-[10px] text-text-muted font-mono">
                {suggestedUsers.length} online scouts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestedUsers.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="p-3 rounded-2xl bg-surface-secondary/40 border border-progress-track hover:border-kaos-pink/30 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-kaos-pink to-kaos-purple flex items-center justify-center text-lg shrink-0 shadow-sm">
                      {user.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-kaos-offwhite truncate">{user.displayName}</span>
                        {user.isOnline && (
                          <span className="w-1.5 h-1.5 rounded-full bg-online animate-pulse shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-text-secondary mt-0.5">
                        <span>@{user.handle}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-kaos-yellow font-mono">Lv {user.level}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onStartDirectMessage(user, 'Hello explorer! Ready to team up on Chennai heritage trails?')}
                    className="px-3 py-1.5 rounded-xl bg-kaos-pink hover:bg-kaos-purple text-white text-[11px] font-bold shrink-0 transition-all cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <span>Say Hi</span>
                    <span className="text-xs">👋</span>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Conversation Icebreakers */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.4 }}
          className="w-full text-left"
        >
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-kaos-yellow">lightbulb</span>
            <span>Popular Heritage Discussion Starters</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (suggestedUsers.length > 0) {
                    onStartDirectMessage(suggestedUsers[idx % suggestedUsers.length], prompt.text);
                  } else {
                    onOpenFindFriends();
                  }
                }}
                className="p-3 rounded-2xl bg-surface-primary hover:bg-surface-secondary border border-progress-track hover:border-kaos-teal/30 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{prompt.icon}</span>
                  <span className="text-xs font-bold text-kaos-offwhite group-hover:text-kaos-teal transition-colors">
                    {prompt.title}
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary line-clamp-2 leading-relaxed">
                  "{prompt.text}"
                </p>
              </button>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};
