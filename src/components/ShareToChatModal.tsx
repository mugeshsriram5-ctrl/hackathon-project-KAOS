import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Conversation,
  ChatAttachment,
  ChatUser,
} from '../types/chat';
import {
  subscribeConversations,
  sendMessage,
  CURRENT_USER,
  EXPLORER_DIRECTORY,
  createDirectConversation,
} from '../services/chatService';

interface ShareToChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: ChatAttachment | null;
  onShowToast: (msg: string) => void;
  onNavigateToChat?: (conversationId: string) => void;
}

export const ShareToChatModal: React.FC<ShareToChatModalProps> = ({
  isOpen,
  onClose,
  attachment,
  onShowToast,
  onNavigateToChat,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [customComment, setCustomComment] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'existing' | 'direct'>('existing');

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribeConversations(CURRENT_USER.id, (list) => {
      setConversations(list);
      if (list.length > 0 && !selectedConvId) {
        setSelectedConvId(list[0].id);
      }
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen || !attachment) return null;

  const handleSendShare = async () => {
    if (!selectedConvId) {
      onShowToast('Please select a conversation to share with.');
      return;
    }

    setSending(true);
    try {
      await sendMessage(
        selectedConvId,
        CURRENT_USER,
        customComment.trim() || `Shared a ${attachment.type}: ${attachment.title}`,
        attachment
      );

      onShowToast(`Shared "${attachment.title}" to chat!`);
      if (onNavigateToChat) {
        onNavigateToChat(selectedConvId);
      }
      onClose();
    } catch (e) {
      onShowToast('Failed to share to chat. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleStartDirectAndShare = async (user: ChatUser) => {
    setSending(true);
    try {
      const convRef = await createDirectConversation(CURRENT_USER.id, user);
      await sendMessage(
        convRef.id,
        CURRENT_USER,
        customComment.trim() || `Shared a ${attachment.type}: ${attachment.title}`,
        attachment
      );
      onShowToast(`Shared "${attachment.title}" with ${user.displayName}!`);
      if (onNavigateToChat) {
        onNavigateToChat(convRef.id);
      }
      onClose();
    } catch (e) {
      onShowToast('Error sharing with user.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#26242C] flex items-center justify-between bg-[#121114]">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#F05423]">send</span>
              <div>
                <h3 className="text-base font-bold text-white">Share to Messages</h3>
                <p className="text-xs text-zinc-400">Send cards directly into your chats</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1C1A1F] border border-[#26242C] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Attachment Preview Card */}
          <div className="p-4 bg-[#121114]/60 border-b border-[#26242C]">
            <div className="p-3 bg-[#1C1A1F] border border-[#26242C] rounded-2xl flex items-center gap-3">
              {attachment.imageUrl ? (
                <img
                  src={attachment.imageUrl}
                  alt={attachment.title}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#26242C]"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#F05423]/20 border border-[#F05423]/40 flex items-center justify-center text-[#F05423] shrink-0">
                  <span className="material-symbols-outlined text-2xl">
                    {attachment.type === 'place'
                      ? 'location_on'
                      : attachment.type === 'quest'
                      ? 'auto_awesome'
                      : attachment.type === 'trail'
                      ? 'route'
                      : 'map'}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F05423] block">
                  {attachment.type} card
                </span>
                <h4 className="text-xs font-bold text-white truncate">{attachment.title}</h4>
                {attachment.description && (
                  <p className="text-[11px] text-zinc-400 line-clamp-1">{attachment.description}</p>
                )}
                {attachment.location && (
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{attachment.location}</p>
                )}
              </div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-[#26242C] bg-[#121114]/40">
            <button
              onClick={() => setActiveSubTab('existing')}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
                activeSubTab === 'existing'
                  ? 'border-[#F05423] text-[#F05423]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Recent Conversations
            </button>
            <button
              onClick={() => setActiveSubTab('direct')}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
                activeSubTab === 'direct'
                  ? 'border-[#F05423] text-[#F05423]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Explorer Contacts
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3 scrollbar-thin">
            {activeSubTab === 'existing' ? (
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">
                    No active conversations. Switch to Explorer Contacts to send a message!
                  </p>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = selectedConvId === conv.id;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#F05423]/10 border-[#F05423] text-white'
                            : 'bg-[#121114] border-[#26242C] text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              conv.imageUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                            }
                            alt={conv.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#26242C]"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{conv.name}</span>
                              {conv.type === 'group' && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                                  Group
                                </span>
                              )}
                            </h5>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {conv.lastMessage?.text || 'No messages'}
                            </p>
                          </div>
                        </div>

                        <div className="pl-2">
                          <span
                            className={`material-symbols-outlined text-lg ${
                              isSelected ? 'text-[#F05423]' : 'text-zinc-600'
                            }`}
                          >
                            {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {EXPLORER_DIRECTORY.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 bg-[#121114] border border-[#26242C] rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover border border-[#26242C]"
                      />
                      <div>
                        <h5 className="text-xs font-bold text-white">{user.displayName}</h5>
                        <p className="text-[10px] text-zinc-400">{user.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartDirectAndShare(user)}
                      disabled={sending}
                      className="px-3 py-1.5 rounded-xl bg-[#F05423] hover:bg-[#d64a1e] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Message Comment Input */}
            {activeSubTab === 'existing' && (
              <div className="pt-2">
                <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                  Add optional note
                </label>
                <input
                  type="text"
                  value={customComment}
                  onChange={(e) => setCustomComment(e.target.value)}
                  placeholder="e.g. Check out this spot for our walk tomorrow!"
                  className="w-full bg-[#121114] border border-[#26242C] rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F05423]"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          {activeSubTab === 'existing' && (
            <div className="p-4 border-t border-[#26242C] bg-[#121114] flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#1C1A1F] border border-[#26242C] text-zinc-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendShare}
                disabled={sending || !selectedConvId}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F05423] to-[#FF8A00] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md"
              >
                {sending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sharing...</span>
                  </>
                ) : (
                  <>
                    <span>Share Now</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
