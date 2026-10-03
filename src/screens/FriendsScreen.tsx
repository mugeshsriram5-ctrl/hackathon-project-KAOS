import React, { useState, useEffect } from 'react';
import { MasterSpot } from '../types';
import { PublicProfileModal } from '../components/PublicProfileModal';
import { ReportPlayerModal } from '../components/ReportPlayerModal';
import { BlockConfirmationModal } from '../components/BlockConfirmationModal';
import { FriendSearch } from '../components/FriendSearch';
import {
  FriendUser,
  FriendRequest,
  subscribeFriends,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  subscribeIncomingRequests,
  blockUser,
  fetchSuggestedPlayers,
  getActiveUserId,
} from '../services/socialService';
import { CURRENT_USER, createDirectConversation } from '../services/chatService';

interface FriendsScreenProps {
  onShowToast: (msg: string) => void;
  onNavigateToMessages?: (conversationId?: string) => void;
  onSelectSpot?: (spot: MasterSpot) => void;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = ({
  onShowToast,
  onNavigateToMessages,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'find'>('all');
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [suggestedPlayers, setSuggestedPlayers] = useState<FriendUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<FriendUser | null>(null);
  const [selectedUserForReport, setSelectedUserForReport] = useState<FriendUser | null>(null);
  const [selectedUserForBlock, setSelectedUserForBlock] = useState<FriendUser | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [friendSuccessNotice, setFriendSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    const currentUid = getActiveUserId();
    const unsubFriends = subscribeFriends(currentUid, (list) => {
      setFriends(list);
    });
    const unsubReqs = subscribeIncomingRequests(currentUid, (reqList) => {
      setIncomingRequests(reqList);
    });
    fetchSuggestedPlayers(currentUid).then((sug) => setSuggestedPlayers(sug));

    return () => {
      unsubFriends();
      unsubReqs();
    };
  }, []);

  return (
    <div className="space-y-6 pb-24 p-4 md:p-8 max-w-5xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#F05423] text-2xl">group</span>
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">KAOS Explorer Squad</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Discover cartographers, share Chennai heritage quests, and explore secret landmarks together
            </p>
          </div>

          {/* Segmented Tab Controls */}
          <div className="flex items-center gap-1.5 bg-[#121114] p-1.5 rounded-2xl border border-[#26242C]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-[#F05423] text-white shadow-lg shadow-[#F05423]/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>All Friends</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-mono">
                {friends.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'requests'
                  ? 'bg-[#F05423] text-white shadow-lg shadow-[#F05423]/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Requests</span>
              {incomingRequests.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-[#F05423] text-[10px] font-extrabold flex items-center justify-center">
                  {incomingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('find')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'find'
                  ? 'bg-[#F05423] text-white shadow-lg shadow-[#F05423]/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Find Players
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {friendSuccessNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-base">verified</span>
            <span>{friendSuccessNotice}</span>
          </div>
          <button
            onClick={() => setFriendSuccessNotice(null)}
            className="text-emerald-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: ALL FRIENDS */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {friends.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-8">
              <div className="w-16 h-16 rounded-2xl bg-[#121114] border border-[#26242C] flex items-center justify-center text-3xl mx-auto text-[#F05423]">
                🧭
              </div>
              <h3 className="text-base font-bold text-white">Your next adventure might start with a new friend.</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Connect with fellow Chennai heritage explorers to share observations, complete daily challenges, and decipher ancient city maps.
              </p>
              <button
                onClick={() => setActiveTab('find')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-[#F05423]/25"
              >
                Find Players
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map((friend) => (
                <div
                  key={friend.uid}
                  className="p-5 rounded-3xl bg-[#1C1A1F] border border-[#26242C] hover:border-[#F05423]/40 transition-all flex items-center justify-between gap-4 shadow-xl group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#F05423]/20 to-amber-500/20 border border-[#26242C] flex items-center justify-center text-3xl shrink-0 shadow-md">
                      {friend.avatar || '🛡️'}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <h4 className="text-sm font-bold text-white truncate">{friend.displayName}</h4>
                        {friend.isVip && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[8px] font-mono font-bold shrink-0">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono truncate">@{friend.username}</p>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#F05423]/20 text-[#F05423]">
                          Level {friend.level || 1}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {(friend.xp || 2400).toLocaleString()} XP
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 truncate">
                          • {friend.badge || 'Cartographer'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={async () => {
                        const conv = await createDirectConversation(CURRENT_USER.id, {
                          id: friend.uid,
                          displayName: friend.displayName,
                          avatarUrl: friend.avatar || '🛡️',
                        });
                        onNavigateToMessages?.(conv.id);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-[#F05423]/20 flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">chat</span>
                      <span>Message</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUserForProfile(friend);
                        setIsProfileModalOpen(true);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">visibility</span>
                      <span>Profile</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="py-16 text-center space-y-2 bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-8">
              <span className="material-symbols-outlined text-4xl text-zinc-600">inbox</span>
              <h3 className="text-sm font-bold text-white">No new requests waiting yet.</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                When fellow explorers send you a friend request on KAOS, you can review and accept them here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xs font-mono text-zinc-400 uppercase font-bold tracking-wider">
                Incoming Friend Requests ({incomingRequests.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-3xl bg-[#1C1A1F] border border-[#F05423]/40 flex items-center justify-between gap-4 shadow-xl animate-in fade-in duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#121114] border border-[#26242C] flex items-center justify-center text-2xl shrink-0">
                        {req.senderAvatar || '🛡️'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{req.senderName}</h4>
                        <p className="text-[11px] text-zinc-400 font-mono truncate">@{req.senderUsername}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F05423]/20 text-[#F05423]">
                            Level {req.senderLevel} Explorer
                          </span>
                          <span className="text-[10px] font-mono text-amber-400 font-bold">
                            {(req.senderXp || 2200).toLocaleString()} XP
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          await declineFriendRequest(req.id);
                          onShowToast('Declined request.');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={async () => {
                          await acceptFriendRequest(req);
                          setFriendSuccessNotice(`You're now friends with ${req.senderName}.`);
                          onShowToast(`You're now friends with ${req.senderName}! 🎉`);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-[#F05423]/25"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FIND PLAYERS */}
      {activeTab === 'find' && (
        <FriendSearch
          users={suggestedPlayers}
          friendsList={friends}
          onViewProfile={(u) => {
            setSelectedUserForProfile(u);
            setIsProfileModalOpen(true);
          }}
          onAddFriend={async (u) => {
            const res = await sendFriendRequest(
              {
                uid: getActiveUserId(),
                displayName: CURRENT_USER.displayName,
                username: 'usha_explorer',
                avatar: CURRENT_USER.avatarUrl || '🛡️',
                level: 12,
                xp: 3400,
              },
              u
            );
            onShowToast(res.message);
          }}
          onOpenChat={async (u) => {
            const conv = await createDirectConversation(CURRENT_USER.id, {
              id: u.uid,
              displayName: u.displayName,
              avatarUrl: u.avatar || '🛡️',
            });
            onNavigateToMessages?.(conv.id);
          }}
        />
      )}

      {/* Public Profile Modal */}
      <PublicProfileModal
        user={selectedUserForProfile}
        currentUser={{
          uid: getActiveUserId(),
          displayName: CURRENT_USER.displayName,
          username: 'usha_explorer',
          avatar: CURRENT_USER.avatarUrl || '🛡️',
          level: 12,
          xp: 3400,
        }}
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedUserForProfile(null);
        }}
        onOpenChat={async (uid) => {
          if (selectedUserForProfile) {
            const conv = await createDirectConversation(CURRENT_USER.id, {
              id: selectedUserForProfile.uid,
              displayName: selectedUserForProfile.displayName,
              avatarUrl: selectedUserForProfile.avatar || '🛡️',
            });
            onNavigateToMessages?.(conv.id);
          }
        }}
        onOpenReport={(u) => {
          setSelectedUserForReport(u);
          setIsReportModalOpen(true);
        }}
        onShowToast={onShowToast}
      />

      {/* Report Player Modal */}
      <ReportPlayerModal
        reportedUserId={selectedUserForReport?.uid || ''}
        reportedName={selectedUserForReport?.displayName || 'Explorer'}
        reporterId={getActiveUserId()}
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedUserForReport(null);
        }}
        onShowToast={onShowToast}
      />

      {/* Block Confirmation Modal */}
      <BlockConfirmationModal
        targetName={selectedUserForBlock?.displayName || 'this player'}
        isOpen={isBlockModalOpen}
        onClose={() => {
          setIsBlockModalOpen(false);
          setSelectedUserForBlock(null);
        }}
        onConfirmBlock={async () => {
          if (!selectedUserForBlock) return;
          const res = await blockUser(getActiveUserId(), {
            uid: selectedUserForBlock.uid,
            displayName: selectedUserForBlock.displayName,
            username: selectedUserForBlock.username,
            avatar: selectedUserForBlock.avatar,
          });
          onShowToast(res.message);
          setIsBlockModalOpen(false);
          setSelectedUserForBlock(null);
        }}
      />
    </div>
  );
};

export default FriendsScreen;
