import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../lib/firebase';
import { 
  searchPlayers, 
  sendFriendRequest, 
  FriendUser, 
  fetchFriends
} from '../services/socialService';

interface PlayerSearchViewProps {
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export const PlayerSearchView: React.FC<PlayerSearchViewProps> = ({ onBack, onShowToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Set<string>>(new Set());
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

  // Load friends to hide "Add Friend" button for existing friends
  useEffect(() => {
    const loadFriends = async () => {
      const list = await fetchFriends();
      setFriends(new Set(list.map(f => f.uid)));
    };
    loadFriends();
  }, []);

  // Live search with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      const players = await searchPlayers(searchQuery);
      setResults(players);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendRequest = async (player: FriendUser) => {
    if (!auth.currentUser) {
      onShowToast('You must be signed in to add friends.');
      return;
    }

    const sender = {
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.displayName || 'Explorer',
      username: auth.currentUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 'explorer_' + auth.currentUser.uid.slice(0, 5),
      avatar: '🛡️',
      level: 1,
      xp: 0
    };

    setPendingRequests(prev => new Set(prev).add(player.uid));
    const res = await sendFriendRequest(sender, player);
    
    if (res.success) {
      onShowToast(res.message);
    } else {
      onShowToast(res.message);
      setPendingRequests(prev => {
        const next = new Set(prev);
        next.delete(player.uid);
        return next;
      });
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background-primary overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-kaos-navy to-kaos-purple p-4 flex items-center gap-3 shrink-0 shadow-lg z-10 border-b border-white/5">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-kaos-offwhite transition-colors">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-kaos-teal text-sm">search</span>
          <input 
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-secondary/50 rounded-xl py-2 pl-9 pr-4 text-xs text-kaos-offwhite border border-white/5 focus:border-kaos-teal/50 focus:outline-none transition-all placeholder:text-text-secondary/50"
            placeholder="Search by username..."
          />
        </div>
      </div>
      
      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-none pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <div className="w-8 h-8 border-2 border-kaos-teal border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-kaos-teal">Scanning Frequencies...</p>
          </div>
        ) : searchQuery && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
            <span className="material-symbols-outlined text-5xl mb-2">person_search</span>
            <p className="text-xs font-black uppercase tracking-tighter">No Explorers Found.</p>
            <p className="text-[10px] mt-1">Try a different frequency or name.</p>
          </div>
        ) : !searchQuery ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
            <span className="material-symbols-outlined text-6xl mb-4">radar</span>
            <h3 className="text-sm font-black uppercase tracking-widest">Global Radar</h3>
            <p className="text-[10px] mt-2 max-w-[200px] leading-relaxed">Enter a handle to locate other explorers on the Chennai grid.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <h3 className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">Search Results ({results.length})</h3>
            <AnimatePresence mode="popLayout">
              {results.map((player) => {
                const isFriend = friends.has(player.uid);
                const isPending = pendingRequests.has(player.uid);

                return (
                  <motion.div 
                    key={player.uid}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-surface-secondary/40 rounded-2xl border border-white/5 backdrop-blur-sm flex items-center justify-between group hover:border-kaos-teal/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-kaos-navy flex items-center justify-center text-xl shadow-inner border border-white/10">
                        {player.avatar || '👤'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-kaos-offwhite">{player.displayName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-kaos-teal">@{player.username}</span>
                          <span className="w-1 h-1 rounded-full bg-white/10"></span>
                          <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">LVL {player.level || 1}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      {isFriend ? (
                        <button 
                          disabled
                          className="px-4 py-2 text-[10px] font-black text-text-secondary bg-white/5 rounded-xl border border-white/5"
                        >
                          FRIENDS
                        </button>
                      ) : isPending ? (
                        <button 
                          disabled
                          className="px-4 py-2 text-[10px] font-black text-kaos-teal/50 bg-kaos-teal/5 rounded-xl border border-kaos-teal/10 flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-kaos-teal animate-pulse"></span>
                          SENT
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleSendRequest(player)}
                          className="px-4 py-2 text-[10px] font-black text-kaos-teal bg-kaos-teal/10 rounded-xl hover:bg-kaos-teal hover:text-kaos-navy border border-kaos-teal/20 transition-all flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-xs">person_add</span>
                          ADD
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerSearchView;
