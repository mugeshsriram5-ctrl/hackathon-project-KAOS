import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../lib/firebase';
import { 
  subscribeConversations, 
  deleteConversation, 
  archiveConversation,
  Conversation 
} from '../services/chatService';
import { 
  subscribeIncomingRequests, 
  acceptFriendRequest, 
  declineFriendRequest,
  FriendRequest 
} from '../services/socialService';

import { MasterSpot } from '../types';
import { ChatDetailView } from '../components/ChatDetailView';
import { PlayerSearchView } from '../components/PlayerSearchView';
import { createDirectConversation, ChatUser } from '../services/chatService';
import { Leaderboard } from '../components/Leaderboard';

export interface NanbarScreenProps {
  onShowToast: (msg: string) => void;
  onSelectSpot?: (spot: any) => void;
  onSelectQuest?: (quest: any) => void;
  onNavigateToMap?: () => void;
  initialConversationId?: string | null;
  masterSpots?: MasterSpot[];
}

export const NanbarScreen: React.FC<NanbarScreenProps> = ({ 
  onShowToast, 
  onSelectSpot,
  onSelectQuest,
  masterSpots = [] 
}) => {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'leaderboard'>('inbox');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  // Load conversations
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = subscribeConversations(auth.currentUser.uid, setConversations);
    return () => unsubscribe();
  }, []);

  // Load friend requests
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = subscribeIncomingRequests(auth.currentUser.uid, setFriendRequests);
    return () => unsubscribe();
  }, []);

  const handleAcceptRequest = async (req: FriendRequest) => {
    if (!auth.currentUser) return;
    try {
      await acceptFriendRequest(req);
      
      // Create a direct conversation automatically upon connection
      const targetUser: ChatUser = {
        id: req.senderId,
        displayName: req.senderName,
        avatarUrl: req.senderAvatar
      };
      
      const convRef = await createDirectConversation(auth.currentUser.uid, targetUser);
      
      onShowToast(`Connected with ${req.senderName}!`);
      
      // Navigate to chat immediately
      if (convRef.id) {
        setActiveConvId(convRef.id);
      }
    } catch (err) {
      console.error('Accept error:', err);
      onShowToast('Failed to connect.');
    }
  };

  const handleDeclineRequest = async (reqId: string) => {
    try {
      await declineFriendRequest(reqId);
      onShowToast('Request declined.');
    } catch (err) {
      onShowToast('Failed to decline.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation(id);
      onShowToast('Conversation deleted.');
    } catch (err) {
      onShowToast('Failed to delete.');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveConversation(id);
      onShowToast('Conversation archived.');
    } catch (err) {
      onShowToast('Failed to archive.');
    }
  };

  if (activeConvId) {
    const conversation = conversations.find(c => c.id === activeConvId);
    if (conversation) {
      return (
        <ChatDetailView 
          conversation={conversation} 
          onBack={() => setActiveConvId(null)} 
          onShowToast={onShowToast}
          onSelectSpot={onSelectSpot}
          onSelectQuest={onSelectQuest}
        />
      );
    }
  }

  if (isSearching) {
    return (
      <PlayerSearchView 
        onBack={() => setIsSearching(false)} 
        onShowToast={onShowToast} 
      />
    );
  }

  // Helper for date/time formatting
  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Merge and sort for unified inbox
  const unifiedInbox = [
    ...friendRequests.map(req => ({ ...req, inboxType: 'request' as const })),
    ...conversations.map(conv => ({ ...conv, inboxType: 'chat' as const }))
  ].sort((a, b) => {
    // Requests always stay at the top if they are pending
    if (a.inboxType === 'request' && b.inboxType === 'chat') return -1;
    if (a.inboxType === 'chat' && b.inboxType === 'request') return 1;
    
    // Sort within types by time
    const timeA = new Date(a.inboxType === 'request' ? (a as FriendRequest).createdAt : (a as Conversation).updatedAt).getTime();
    const timeB = new Date(b.inboxType === 'request' ? (b as FriendRequest).createdAt : (b as Conversation).updatedAt).getTime();
    return timeB - timeA;
  });

  return (
    <div className="h-full w-full flex flex-col bg-background-primary text-kaos-offwhite overflow-hidden">
      <div className="bg-gradient-to-r from-kaos-pink to-kaos-purple p-4 shadow-xl shrink-0 z-10 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-kaos-offwhite tracking-wider uppercase">Nanbar Hub</h2>
          <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab('inbox')}
              className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all cursor-pointer ${
                activeTab === 'inbox' ? 'bg-white/10 text-white shadow-inner' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Inbox
            </button>
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all cursor-pointer ${
                activeTab === 'leaderboard' ? 'bg-white/10 text-white shadow-inner' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Ranks
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button 
            onClick={() => setIsSearching(true)}
            className="px-3 py-1.5 rounded-xl bg-kaos-navy/80 hover:bg-kaos-navy text-kaos-teal font-extrabold text-[10px] flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer border border-kaos-teal/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[10px]">search</span>
            Search Players
          </button>
          <button className="px-3 py-1.5 rounded-xl bg-kaos-navy/80 hover:bg-kaos-navy text-kaos-pink font-extrabold text-[10px] flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer border border-kaos-pink/20 transition-all active:scale-95">
            <span className="material-symbols-outlined text-[10px]">group_add</span>
            Create Group
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'inbox' ? (
            <motion.div 
              key="inbox"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto scrollbar-none pb-24">
                <div className="p-4 py-3 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">Unified Transmissions</h3>
                  <button className="text-[9px] font-bold text-kaos-purple uppercase tracking-widest opacity-40">Archive All</button>
                </div>

                <div className="flex flex-col">
                  <AnimatePresence mode="popLayout">
                    {unifiedInbox.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 opacity-20">
                        <span className="material-symbols-outlined text-6xl mb-4">inbox</span>
                        <p className="text-xs font-black uppercase tracking-tighter">Frequency Silent.</p>
                      </div>
                    ) : (
                      unifiedInbox.map((item) => {
                        if (item.inboxType === 'request') {
                          const req = item as FriendRequest;
                          return (
                            <motion.div 
                              key={req.id} 
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="p-4 bg-surface-secondary/20 border-b border-white/5 flex items-center gap-4 group"
                            >
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-kaos-navy flex items-center justify-center text-xl shadow-inner border border-white/10">
                                  {req.senderAvatar || '👤'}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-kaos-teal text-kaos-navy rounded-full flex items-center justify-center border-2 border-background-primary shadow-[0_0_8px_#2DD4BF]">
                                  <span className="material-symbols-outlined text-[10px] font-black">person_add</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <button 
                                    onClick={() => handleAcceptRequest(req)}
                                    className="text-xs font-black text-kaos-offwhite truncate tracking-tight hover:text-kaos-teal transition-colors text-left uppercase"
                                  >
                                    {req.senderName}
                                  </button>
                                  <span className="text-[8px] font-black text-kaos-teal bg-kaos-teal/10 px-1.5 py-0.5 rounded uppercase tracking-widest">New Request</span>
                                </div>
                                <p className="text-[10px] text-text-secondary opacity-60 font-bold uppercase tracking-widest">Awaiting connection...</p>
                                <div className="flex gap-2 mt-2.5">
                                  <button 
                                    onClick={() => handleAcceptRequest(req)}
                                    className="px-4 py-1.5 text-[9px] font-black text-kaos-teal bg-kaos-teal/10 rounded-lg hover:bg-kaos-teal hover:text-kaos-navy transition-all active:scale-95"
                                  >
                                    ACCEPT
                                  </button>
                                  <button 
                                    onClick={() => handleDeclineRequest(req.id)}
                                    className="px-4 py-1.5 text-[9px] font-black text-kaos-pink bg-kaos-pink/10 rounded-lg hover:bg-kaos-pink hover:text-kaos-navy transition-all active:scale-95"
                                  >
                                    DECLINE
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        } else {
                          const conv = item as Conversation;
                          return (
                            <motion.div 
                              key={conv.id} 
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -50 }}
                              className="relative w-full overflow-hidden"
                            >
                              <div className="absolute inset-0 flex justify-end items-center bg-surface-secondary">
                                <button onClick={() => handleArchive(conv.id)} className="h-full px-6 text-[10px] font-black uppercase tracking-widest text-kaos-teal bg-surface-secondary/50 hover:bg-kaos-teal hover:text-kaos-navy transition-all">Archive</button>
                                <button onClick={() => handleDelete(conv.id)} className="h-full px-6 text-[10px] font-black uppercase tracking-widest text-kaos-pink bg-surface-secondary/80 hover:bg-kaos-pink hover:text-kaos-navy transition-all">Delete</button>
                              </div>
                              <motion.button
                                drag="x"
                                dragConstraints={{ left: -160, right: 0 }}
                                dragDirectionLock
                                onClick={() => setActiveConvId(conv.id)}
                                className="relative w-full p-4 bg-background-primary flex items-center gap-4 hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5"
                              >
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center text-xl shrink-0 border border-white/10 shadow-lg overflow-hidden">
                                    {conv.imageUrl ? (
                                      <img src={conv.imageUrl} alt={conv.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>👤</span>
                                    )}
                                  </div>
                                  {conv.unreadCount && conv.unreadCount > 0 ? (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-kaos-pink text-kaos-navy rounded-full flex items-center justify-center text-[10px] font-black border-2 border-background-primary animate-bounce shadow-lg">
                                      {conv.unreadCount}
                                    </div>
                                  ) : (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-kaos-teal rounded-full border-2 border-background-primary shadow-[0_0_8px_#2DD4BF]"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <h4 className="text-xs font-black text-kaos-offwhite truncate tracking-tight uppercase">{conv.name}</h4>
                                    <span className="text-[9px] font-bold text-text-secondary opacity-40 uppercase">{formatRelativeTime(conv.lastMessage?.createdAt || conv.updatedAt)}</span>
                                  </div>
                                  <p className={`text-[11px] truncate ${conv.unreadCount && conv.unreadCount > 0 ? 'text-kaos-offwhite font-bold' : 'text-text-secondary opacity-60'}`}>
                                    {conv.lastMessage?.text || 'No messages yet.'}
                                  </p>
                                </div>
                              </motion.button>
                            </motion.div>
                          );
                        }
                      })
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="leaderboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Leaderboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NanbarScreen;
