import React, { useState } from 'react';
import { FriendUser } from '../services/socialService';
import { FriendSearchResultCard } from './FriendSearchResultCard';

interface FriendSearchProps {
  users: FriendUser[];
  onViewProfile: (user: FriendUser) => void;
  onAddFriend: (user: FriendUser) => void;
  onOpenChat?: (user: FriendUser) => void;
  friendsList?: FriendUser[];
}

export const FriendSearch: React.FC<FriendSearchProps> = ({
  users,
  onViewProfile,
  onAddFriend,
  onOpenChat,
  friendsList = [],
}) => {
  const [query, setQuery] = useState('');

  const cleanQuery = query.trim().toLowerCase();
  const normalizedQuery = cleanQuery.startsWith('@') ? cleanQuery.substring(1) : cleanQuery;

  const filtered = users.filter((u) => {
    if (!normalizedQuery) return true;
    return (
      u.username.toLowerCase().includes(normalizedQuery) ||
      u.displayName.toLowerCase().includes(normalizedQuery)
    );
  });

  const friendUids = new Set(friendsList.map((f) => f.uid));

  return (
    <div className="space-y-4 font-sans">
      {/* Search Bar Input */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#1C1A1F] border border-[#26242C] space-y-2.5 shadow-xl">
        <label className="text-xs font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F05423] text-base">search</span>
          <span>Find Players by Unique Handle (@handle) or Display Name</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-3 text-zinc-500 font-mono text-xs font-bold">
              @
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter handle e.g. @priya_raj or display name..."
              className="w-full bg-[#121114] border border-[#26242C] focus:border-[#F05423] rounded-2xl pl-8 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none transition-colors"
            />
          </div>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="px-3.5 py-2.5 rounded-2xl bg-[#121114] border border-[#26242C] text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-mono uppercase text-zinc-400 font-bold px-1">
        <span>
          {query ? `Search Results (${filtered.length})` : `Suggested Players (${filtered.length})`}
        </span>
        <span className="text-[10px] text-zinc-500 font-normal">Active in Chennai sectors</span>
      </div>

      {/* Results List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center space-y-2 bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-6">
          <span className="material-symbols-outlined text-3xl text-zinc-600">person_search</span>
          <h4 className="text-xs font-bold text-white">No explorer found matching "{query}"</h4>
          <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
            Check for typos in the handle or search by exact display name.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <FriendSearchResultCard
              key={user.uid}
              user={user}
              onViewProfile={onViewProfile}
              onAddFriend={onAddFriend}
              onOpenChat={onOpenChat}
              isFriend={friendUids.has(user.uid)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
