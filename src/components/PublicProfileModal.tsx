import React, { useState } from 'react';
import { FriendUser, sendFriendRequest, blockUser } from '../services/socialService';

interface PublicProfileModalProps {
  user: FriendUser | null;
  currentUser: { uid: string; displayName: string; username: string; avatar: string; level: number; xp: number };
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (userId: string) => void;
  onOpenReport: (user: FriendUser) => void;
  onShowToast: (msg: string) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  user,
  currentUser,
  isOpen,
  onClose,
  onOpenChat,
  onOpenReport,
  onShowToast,
}) => {
  const [requestSent, setRequestSent] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  if (!isOpen || !user) return null;

  const handleAddFriend = async () => {
    const res = await sendFriendRequest(
      {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        username: currentUser.username,
        avatar: currentUser.avatar,
        level: currentUser.level,
        xp: currentUser.xp,
      },
      user
    );
    setRequestSent(true);
    onShowToast(res.message);
  };

  const handleBlockConfirm = async () => {
    const res = await blockUser(currentUser.uid, {
      uid: user.uid,
      displayName: user.displayName,
      username: user.username,
      avatar: user.avatar,
    });
    onShowToast(res.message);
    setShowBlockConfirm(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative overflow-hidden"
      >
        {/* Top Header Controls */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#F05423] font-bold uppercase tracking-widest bg-[#F05423]/10 px-2.5 py-1 rounded-full border border-[#F05423]/25">
            KAOS Explorer Profile
          </span>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#F05423] to-[#FF8A00] flex items-center justify-center text-4xl shadow-xl shadow-[#F05423]/25 shrink-0">
            {user.avatar || '🛡️'}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white truncate">{user.displayName}</h3>
              {user.isVip && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-mono font-bold">
                  VIP
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-mono">@{user.username}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F05423]/20 text-[#F05423]">
                Level {user.level || 1} Cartographer
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                {user.availabilityStatus || 'Available Now'}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-xs text-zinc-300 bg-[#121114] border border-[#26242C] p-3 rounded-2xl leading-relaxed italic">
            "{user.bio}"
          </p>
        )}

        {/* KAOS Journey Statistics */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-[#121114] border border-[#26242C] text-center">
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Quests</p>
            <p className="text-base font-extrabold text-white">{user.questsCompleted || 18}</p>
          </div>
          <div className="border-x border-[#26242C]">
            <p className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Discoveries</p>
            <p className="text-base font-extrabold text-[#F05423]">{user.discoveriesCount || 34}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Total XP</p>
            <p className="text-base font-extrabold text-amber-400">{(user.xp || 2400).toLocaleString()}</p>
          </div>
        </div>

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Exploration Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {user.interests.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#121114] border border-[#26242C] text-zinc-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* KAOS Philosophy Quote */}
        <p className="text-[11px] text-zinc-500 text-center italic border-t border-[#26242C]/60 pt-3">
          "This explorer has mapped vaulted corridors, sacred tanks, and century-old roasteries across Chennai."
        </p>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={handleAddFriend}
              disabled={requestSent}
              className="py-2.5 rounded-xl bg-[#F05423] hover:bg-[#ff6a38] text-white font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-[#F05423]/25 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span>{requestSent ? 'Request Sent ✓' : 'Add Friend'}</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenChat(user.uid);
              }}
              className="py-2.5 rounded-xl bg-[#121114] hover:bg-[#26242C] border border-[#26242C] text-zinc-200 hover:text-white font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              <span>Message</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 px-1">
            <button
              onClick={() => {
                onClose();
                onOpenReport(user);
              }}
              className="text-zinc-500 hover:text-rose-400 font-semibold cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">flag</span>
              <span>Report Player</span>
            </button>
            <button
              onClick={() => setShowBlockConfirm(true)}
              className="text-zinc-500 hover:text-rose-400 font-semibold cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">block</span>
              <span>Block Player</span>
            </button>
          </div>
        </div>

        {/* Inline Block Confirmation Popup */}
        {showBlockConfirm && (
          <div className="absolute inset-0 bg-[#1C1A1F]/95 backdrop-blur-md p-6 flex flex-col justify-center items-center text-center space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center text-2xl">
              <span className="material-symbols-outlined">block</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Block {user.displayName}?</h4>
              <p className="text-xs text-zinc-400 max-w-xs mt-1">
                You won't be able to message or interact with each other through KAOS.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs text-xs">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="py-2 rounded-xl bg-[#121114] border border-[#26242C] text-zinc-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockConfirm}
                className="py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
              >
                Confirm Block
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
