import React from 'react';
import { FriendUser } from '../services/socialService';

interface FriendSearchResultCardProps {
  user: FriendUser;
  onViewProfile: (user: FriendUser) => void;
  onAddFriend: (user: FriendUser) => void;
  onOpenChat?: (user: FriendUser) => void;
  isFriend?: boolean;
  isPending?: boolean;
}

export const FriendSearchResultCard: React.FC<FriendSearchResultCardProps> = ({
  user,
  onViewProfile,
  onAddFriend,
  onOpenChat,
  isFriend = false,
  isPending = false,
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[#1C1A1F] border border-[#26242C] hover:border-[#F05423]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl group">
      {/* Left: User Identity & Stats */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#F05423]/20 via-[#26242C] to-amber-500/20 border border-[#26242C] flex items-center justify-center text-2xl shrink-0 shadow-md group-hover:scale-105 transition-transform">
          {user.avatar || '🛡️'}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="text-sm font-extrabold text-white truncate">{user.displayName}</h4>
            {user.isVip && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[8px] font-mono font-bold shrink-0">
                VIP
              </span>
            )}
          </div>

          <p className="text-[11px] text-zinc-400 font-mono truncate">
            @{user.username.replace(/^@/, '')}
          </p>

          {/* Stats Bar: Level, XP, Badge */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#F05423]/20 text-[#F05423] border border-[#F05423]/30">
              Level {user.level || 1}
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
              {(user.xp || 2800).toLocaleString()} XP
            </span>
            {user.badge && (
              <span className="text-[10px] font-mono text-zinc-300 px-2 py-0.5 rounded bg-[#121114] border border-[#26242C] truncate">
                🎖️ {user.badge}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#26242C]">
        <button
          onClick={() => onViewProfile(user)}
          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-xs">visibility</span>
          <span>Profile</span>
        </button>

        {isFriend ? (
          <button
            onClick={() => onOpenChat?.(user)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-[#F05423]/25 flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">chat</span>
            <span>Chat</span>
          </button>
        ) : isPending ? (
          <button
            disabled
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#26242C] text-zinc-400 text-xs font-bold cursor-not-allowed opacity-80"
          >
            Requested
          </button>
        ) : (
          <button
            onClick={() => onAddFriend(user)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-[#F05423]/25 flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">person_add</span>
            <span>Add Friend</span>
          </button>
        )}
      </div>
    </div>
  );
};
