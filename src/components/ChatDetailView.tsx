import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../lib/firebase';
import { 
  getMessagesQuery, 
  sendMessage, 
  markConversationAsRead,
  setTypingStatus,
  subscribeToConversation,
  Message,
  Conversation,
  ChatUser
} from '../services/chatService';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';

interface ChatDetailViewProps {
  conversation: Conversation;
  onBack: () => void;
  onShowToast: (msg: string) => void;
  onSelectSpot?: (spot: any) => void;
  onSelectQuest?: (quest: any) => void;
}

export const ChatDetailView: React.FC<ChatDetailViewProps> = ({ 
  conversation: initialConversation, 
  onBack, 
  onShowToast,
  onSelectSpot,
  onSelectQuest
}) => {
  const [messageText, setMessageText] = useState('');
  const [conversation, setConversation] = useState<Conversation>(initialConversation);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the useFirestoreQuery hook to subscribe to messages
  const messagesQuery = useMemo(() => getMessagesQuery(conversation.id), [conversation.id]);
  const { data: rawMessages } = useFirestoreQuery<Message>(messagesQuery);

  // Subscribe to conversation for real-time typing status
  useEffect(() => {
    if (!conversation.id) return;
    const unsubscribe = subscribeToConversation(conversation.id, setConversation);
    return () => unsubscribe();
  }, [conversation.id]);

  // Handle local typing status
  useEffect(() => {
    const userId = auth.currentUser?.uid || 'usha_baskar_explorer';
    if (!messageText.trim()) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        setTypingStatus(conversation.id, userId, false);
        typingTimeoutRef.current = null;
      }
      return;
    }

    setTypingStatus(conversation.id, userId, true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(conversation.id, userId, false);
      typingTimeoutRef.current = null;
    }, 2500);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [messageText, conversation.id]);

  // Process messages to handle Firestore timestamps
  const messages = useMemo(() => {
    return rawMessages.map(msg => {
      let createdAt = msg.createdAt;
      if (createdAt && typeof (createdAt as any).toDate === 'function') {
        createdAt = (createdAt as any).toDate().toISOString();
      }
      return { ...msg, createdAt };
    });
  }, [rawMessages]);

  // Mark as read on entry & when new messages arrive
  useEffect(() => {
    if (conversation.id) {
      const currentUserId = auth.currentUser?.uid || 'usha_baskar_explorer';
      markConversationAsRead(conversation.id, currentUserId);
    }
  }, [conversation.id, rawMessages.length]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setMessageText('');
    try {
      const sender: ChatUser = {
        id: auth.currentUser?.uid || 'anonymous',
        displayName: auth.currentUser?.displayName || 'User',
        avatarUrl: '👤'
      };
      await sendMessage(conversation.id, sender, messageText);
    } catch (err) {
      console.error('Failed to send message:', err);
      onShowToast('Failed to send message.');
    }
  };

  // Helper for date formatting
  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const groupedMessages = useMemo(() => {
    return messages.reduce((groups: { [key: string]: Message[] }, message) => {
      const dateKey = new Date(message.createdAt).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(message);
      return groups;
    }, {});
  }, [messages]);

  const isOtherTyping = useMemo(() => {
    if (!conversation.typingStatus) return false;
    const currentUserId = auth.currentUser?.uid || 'usha_baskar_explorer';
    return Object.entries(conversation.typingStatus).some(([uid, isTyping]) => uid !== currentUserId && isTyping);
  }, [conversation.typingStatus]);

  const handleExportChat = () => {
    const timestamp = new Date().toLocaleString();
    let content = `=====================================================\n`;
    content += `   KAOS EXPEDITION CHAT EXPORT & LORE DOSSIER\n`;
    content += `=====================================================\n\n`;
    content += `Thread: ${conversation.name} (${conversation.type.toUpperCase()})\n`;
    content += `Thread ID: ${conversation.id}\n`;
    content += `Export Date: ${timestamp}\n`;
    content += `Total Messages: ${messages.length}\n\n`;
    content += `-----------------------------------------------------\n`;
    content += `   CHRONOLOGICAL EXPEDITION LOG\n`;
    content += `-----------------------------------------------------\n\n`;

    if (messages.length === 0) {
      content += `[No message logs found in this thread]\n`;
    } else {
      messages.forEach((m) => {
        const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        content += `[${time}] ${m.senderName}:\n`;
        content += `  ${m.text}\n`;
        if (m.attachment) {
          content += `  [ATTACHMENT: ${m.attachment.title} (${m.attachment.type.toUpperCase()})]\n`;
          if (m.attachment.description) content += `  Description: ${m.attachment.description}\n`;
        }
        content += `\n`;
      });
    }

    content += `-----------------------------------------------------\n`;
    content += `   DISCOVERED LORE & FIELD INSIGHTS SUMMARY\n`;
    content += `-----------------------------------------------------\n`;
    const insights = messages.filter((m) => m.attachment || m.text.includes('•') || m.text.includes('Archive') || m.text.includes('Decrypted'));
    if (insights.length > 0) {
      insights.forEach((m) => {
        if (m.attachment) content += `• Landmark Card: ${m.attachment.title}\n`;
        if (m.text.includes('•')) content += `• Lore Note: ${m.text.replace(/\n+/g, ' ')}\n`;
      });
    } else {
      content += `• Chennai Heritage Intel: Madras archives cataloged from conversation log.\n`;
    }

    content += `\n=====================================================\n`;
    content += `Generated by KAOS Heritage Protocol · Chennai Explorer\n`;
    content += `=====================================================\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = conversation.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `KAOS_Chat_Export_${safeName}_${new Date().toISOString().slice(0, 10)}.txt`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onShowToast(`Exported "${filename}" successfully!`);
  };

  return (
    <div className="h-full w-full flex flex-col bg-background-primary overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-kaos-pink to-kaos-purple p-4 flex items-center gap-3 shrink-0 shadow-lg z-10 border-b border-white/10">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-kaos-offwhite transition-colors active:scale-90">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-lg border border-white/20 shadow-inner overflow-hidden">
          {conversation.imageUrl ? (
            <img src={conversation.imageUrl} alt={conversation.name} className="w-full h-full object-cover" />
          ) : (
            <span>👤</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-kaos-offwhite truncate tracking-tight uppercase">{conversation.name}</h2>
          <div className="flex items-center gap-1">
            {isOtherTyping ? (
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-kaos-teal uppercase tracking-widest animate-pulse">Typing</span>
                <div className="flex gap-0.5">
                  <span className="w-0.5 h-0.5 bg-kaos-teal rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-0.5 h-0.5 bg-kaos-teal rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-0.5 h-0.5 bg-kaos-teal rounded-full animate-bounce"></span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-kaos-teal shadow-[0_0_8px_#2DD4BF] animate-pulse"></span>
                <p className="text-[9px] font-bold text-kaos-teal uppercase tracking-widest opacity-80">Sync Active</p>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleExportChat}
          className="px-2.5 py-1.5 rounded-xl bg-surface-primary/60 hover:bg-surface-primary text-kaos-offwhite hover:text-kaos-teal border border-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
          title="Export conversation log & lore summary"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          <span className="hidden sm:inline">Export Chat</span>
        </button>
        <button className="text-kaos-offwhite/50 hover:text-kaos-offwhite">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 scrollbar-none">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center p-8">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-kaos-offwhite flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl">chat_bubble</span>
            </div>
            <p className="text-sm font-black uppercase tracking-tighter">Frequency Silent.</p>
            <p className="text-[10px] mt-1 uppercase font-bold tracking-widest">Begin your transmission.</p>
          </div>
        ) : (
          Object.keys(groupedMessages).map((dateKey) => (
            <div key={dateKey} className="flex flex-col gap-5">
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-[1px] bg-white/5"></div>
                <span className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] px-2 opacity-50">
                  {formatMessageDate(groupedMessages[dateKey][0].createdAt)}
                </span>
                <div className="flex-1 h-[1px] bg-white/5"></div>
              </div>
              
              <AnimatePresence initial={false} mode="popLayout">
                {groupedMessages[dateKey].map((msg) => {
                  const isMe = msg.senderId === auth.currentUser?.uid;
                  const hasAttachment = !!msg.attachment;

                  return (
                    <motion.div 
                      key={msg.id}
                      layout
                      initial={{ 
                        opacity: 0, 
                        x: isMe ? 24 : -24, 
                        y: 12, 
                        scale: 0.92 
                      }}
                      animate={{ 
                        opacity: 1, 
                        x: 0, 
                        y: 0, 
                        scale: 1 
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.9, 
                        y: -8 
                      }}
                      transition={{ 
                        type: 'spring',
                        stiffness: isMe ? 480 : 420,
                        damping: 25,
                        mass: 0.7
                      }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div 
                        className={`group relative rounded-2xl max-w-[85%] shadow-xl transition-all duration-300 ${
                          isMe 
                            ? 'bg-gradient-to-br from-kaos-pink to-kaos-purple text-white rounded-tr-none' 
                            : 'bg-surface-secondary/80 backdrop-blur-sm text-kaos-offwhite rounded-tl-none border border-white/5'
                        } ${hasAttachment ? 'p-1 pb-2' : 'p-3.5'}`}
                      >
                        {hasAttachment && msg.attachment && (
                          <div 
                            onClick={() => {
                              if (msg.attachment?.type === 'place' && onSelectSpot) {
                                onSelectSpot({ id: msg.attachment.id, title: msg.attachment.title, ...msg.attachment.extraData });
                              } else if (msg.attachment?.type === 'quest' && onSelectQuest) {
                                onSelectQuest({ id: msg.attachment.id, title: msg.attachment.title, ...msg.attachment.extraData });
                              }
                            }}
                            className="mb-2 overflow-hidden rounded-xl bg-background-primary/50 border border-white/10 cursor-pointer active:scale-[0.98] transition-transform"
                          >
                            {msg.attachment.imageUrl && (
                              <img src={msg.attachment.imageUrl} alt={msg.attachment.title} className="w-full h-24 object-cover opacity-80" />
                            )}
                            <div className="p-2.5">
                              <span className="text-[8px] font-black text-kaos-teal uppercase tracking-widest">{msg.attachment.type} CARD</span>
                              <h5 className="text-[11px] font-black truncate text-kaos-offwhite">{msg.attachment.title}</h5>
                              <p className="text-[9px] text-text-secondary line-clamp-1 opacity-80 mt-0.5">{msg.attachment.description}</p>
                            </div>
                          </div>
                        )}
                        
                        {msg.text && (
                          <p className={`text-[13px] leading-relaxed break-words font-medium ${hasAttachment ? 'px-2 pb-1 opacity-90' : ''}`}>
                            {msg.text}
                          </p>
                        )}
                      </div>
                      
                      <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[8px] font-black text-text-secondary uppercase opacity-40 tracking-tighter">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <span
                            className="inline-flex items-center ml-0.5"
                            title={
                              msg.status === 'read'
                                ? 'Read by recipient'
                                : msg.status === 'sent' || msg.status === 'delivered'
                                ? 'Delivered'
                                : 'Sending...'
                            }
                          >
                            {msg.status === 'read' ? (
                              <span className="material-symbols-outlined text-[13px] text-kaos-teal font-black drop-shadow">
                                done_all
                              </span>
                            ) : msg.status === 'sent' || msg.status === 'delivered' ? (
                              <span className="material-symbols-outlined text-[13px] text-white/70 font-semibold">
                                check
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-[11px] text-white/50 animate-spin">
                                sync
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-6" />
      </div>
      
      {/* Composer Area */}
      <div className="p-4 bg-background-primary border-t border-white/5 shrink-0 z-10 backdrop-blur-xl bg-opacity-95">
        <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
          <div className="flex-1 relative group">
            <input 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-surface-secondary/40 hover:bg-surface-secondary/60 rounded-2xl py-3.5 px-5 text-xs text-kaos-offwhite border border-white/5 focus:border-kaos-pink/50 focus:outline-none transition-all placeholder:text-text-secondary/50 shadow-inner"
              placeholder="Broadcast message..."
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button type="button" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-secondary hover:text-kaos-teal transition-colors">
                <span className="material-symbols-outlined text-lg">attachment</span>
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={!messageText.trim()}
            className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
              messageText.trim() 
                ? 'bg-gradient-to-r from-kaos-pink to-kaos-purple text-white shadow-xl shadow-kaos-pink/30 scale-100 rotate-0' 
                : 'bg-surface-secondary/50 text-text-secondary scale-95 opacity-40'
            }`}
          >
            <span className="material-symbols-outlined text-xl">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatDetailView;
