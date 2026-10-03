import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SearchResultItem {
  id: string;
  source: 'direct' | 'group' | 'bot' | 'friend';
  title: string;
  subtitle?: string;
  snippet: string;
  timestamp?: string;
  avatar: string;
  convId?: string;
  rawUser?: any;
}

interface MessagesGlobalSearchBarProps {
  conversations: any[];
  chatMessages: Record<string, any[]>;
  kaosBotMessages?: any[];
  friends: any[];
  onSelectDirectMessage: (convId: string) => void;
  onSelectGroupMessage: (convId: string) => void;
  onSelectBotMessage: (botMsg: any) => void;
  onSelectFriend: (friend: any) => void;
}

const PRESET_KEYWORDS = ['coffee', 'gopuram', 'ledger', 'survey', 'heritage', 'quest', 'coordinates'];

export const MessagesGlobalSearchBar: React.FC<MessagesGlobalSearchBarProps> = ({
  conversations,
  chatMessages,
  kaosBotMessages = [],
  friends,
  onSelectDirectMessage,
  onSelectGroupMessage,
  onSelectBotMessage,
  onSelectFriend,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'group' | 'bot' | 'friend'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper function to highlight matched keyword
  const highlightMatch = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-kaos-yellow/25 text-kaos-yellow px-0.5 rounded font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Search Results indexing
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];

    // 1. Search in Direct & Group Conversations Chat Messages
    conversations.forEach((conv) => {
      const msgs = chatMessages[conv.id] || [];
      msgs.forEach((msg) => {
        if (msg.text && msg.text.toLowerCase().includes(q)) {
          results.push({
            id: `msg_${msg.id}_${conv.id}`,
            source: conv.type === 'group' ? 'group' : 'direct',
            title: conv.name,
            subtitle: `${msg.senderName} · ${conv.type === 'group' ? 'Group Chat' : 'Direct Message'}`,
            snippet: msg.text,
            timestamp: msg.timestamp,
            avatar: conv.avatar || '💬',
            convId: conv.id,
          });
        }
      });

      // Also match conversation name or group quest name
      if (conv.name.toLowerCase().includes(q) || (conv.groupQuestName && conv.groupQuestName.toLowerCase().includes(q))) {
        results.push({
          id: `conv_${conv.id}`,
          source: conv.type === 'group' ? 'group' : 'direct',
          title: conv.name,
          subtitle: conv.groupQuestName ? `Quest: ${conv.groupQuestName}` : `Thread with ${conv.name}`,
          snippet: conv.lastMessageText || 'Open conversation thread',
          timestamp: conv.lastMessageTime,
          avatar: conv.avatar || (conv.type === 'group' ? '🏛️' : '👤'),
          convId: conv.id,
        });
      }
    });

    // 2. Search in KAOS Bot Chat History
    kaosBotMessages.forEach((botMsg, idx) => {
      const msgText = typeof botMsg === 'string' ? botMsg : botMsg.text || '';
      if (msgText && msgText.toLowerCase().includes(q)) {
        const isBot = botMsg.sender === 'bot' || !botMsg.sender;
        results.push({
          id: `bot_msg_${idx}`,
          source: 'bot',
          title: isBot ? 'KAOS Gemini Assistant' : 'Your Question to KAOS Bot',
          subtitle: 'Gemini Heritage & Radar Knowledge Base',
          snippet: msgText,
          timestamp: botMsg.timestamp || 'Bot History',
          avatar: isBot ? '🤖' : '🛡️',
        });
      }
    });

    // 3. Search in Friends / Explorers
    friends.forEach((f) => {
      if (
        f.displayName.toLowerCase().includes(q) ||
        f.handle.toLowerCase().includes(q) ||
        (f.bio && f.bio.toLowerCase().includes(q)) ||
        (f.badge && f.badge.toLowerCase().includes(q))
      ) {
        results.push({
          id: `friend_${f.id}`,
          source: 'friend',
          title: f.displayName,
          subtitle: `@${f.handle} · ${f.badge || 'Explorer'}`,
          snippet: f.bio || 'Chennai Cartographer Teammate',
          avatar: f.avatar || '🧭',
          rawUser: f,
        });
      }
    });

    return results;
  }, [query, conversations, chatMessages, kaosBotMessages, friends]);

  const filteredResults = useMemo(() => {
    if (activeFilter === 'all') return searchResults;
    return searchResults.filter((r) => r.source === activeFilter);
  }, [searchResults, activeFilter]);

  const counts = useMemo(() => {
    return {
      all: searchResults.length,
      direct: searchResults.filter((r) => r.source === 'direct').length,
      group: searchResults.filter((r) => r.source === 'group').length,
      bot: searchResults.filter((r) => r.source === 'bot').length,
      friend: searchResults.filter((r) => r.source === 'friend').length,
    };
  }, [searchResults]);

  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    if (item.source === 'direct' && item.convId) {
      onSelectDirectMessage(item.convId);
    } else if (item.source === 'group' && item.convId) {
      onSelectGroupMessage(item.convId);
    } else if (item.source === 'bot') {
      onSelectBotMessage(item);
    } else if (item.source === 'friend' && item.rawUser) {
      onSelectFriend(item.rawUser);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full mb-5 z-30">
      {/* Search Bar Input Container */}
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3.5 text-text-muted text-lg pointer-events-none transition-colors">
          search
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder="Search conversations, friends, group chats, or KAOS Bot history..."
          className="w-full bg-surface-primary/95 border border-progress-track hover:border-kaos-teal/50 focus:border-kaos-teal rounded-2xl pl-10 pr-24 py-3 text-xs text-kaos-offwhite focus:outline-none transition-all placeholder-text-muted shadow-lg backdrop-blur-md"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="p-1 rounded-lg hover:bg-surface-secondary text-text-muted hover:text-kaos-offwhite cursor-pointer"
              title="Clear search"
            >
              <span className="material-symbols-outlined text-sm font-bold">close</span>
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-secondary border border-progress-track text-[9px] font-mono text-text-muted">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full mt-2 bg-surface-primary border border-progress-track/90 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl max-h-[440px] flex flex-col"
          >
            {/* Filter Tabs when search query is active */}
            {query.trim() && (
              <div className="p-2.5 border-b border-progress-track/60 bg-background-secondary/70 flex items-center justify-between gap-1 overflow-x-auto shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      activeFilter === 'all'
                        ? 'bg-kaos-teal text-kaos-navy'
                        : 'text-text-secondary hover:text-kaos-offwhite hover:bg-surface-secondary'
                    }`}
                  >
                    All ({counts.all})
                  </button>
                  {counts.direct > 0 && (
                    <button
                      onClick={() => setActiveFilter('direct')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        activeFilter === 'direct'
                          ? 'bg-kaos-pink text-white'
                          : 'text-text-secondary hover:text-kaos-offwhite hover:bg-surface-secondary'
                      }`}
                    >
                      DMs ({counts.direct})
                    </button>
                  )}
                  {counts.group > 0 && (
                    <button
                      onClick={() => setActiveFilter('group')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        activeFilter === 'group'
                          ? 'bg-kaos-purple text-white'
                          : 'text-text-secondary hover:text-kaos-offwhite hover:bg-surface-secondary'
                      }`}
                    >
                      Groups ({counts.group})
                    </button>
                  )}
                  {counts.bot > 0 && (
                    <button
                      onClick={() => setActiveFilter('bot')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        activeFilter === 'bot'
                          ? 'bg-kaos-yellow text-kaos-navy'
                          : 'text-text-secondary hover:text-kaos-offwhite hover:bg-surface-secondary'
                      }`}
                    >
                      KAOS Bot ({counts.bot})
                    </button>
                  )}
                  {counts.friend > 0 && (
                    <button
                      onClick={() => setActiveFilter('friend')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        activeFilter === 'friend'
                          ? 'bg-kaos-teal text-kaos-navy'
                          : 'text-text-secondary hover:text-kaos-offwhite hover:bg-surface-secondary'
                      }`}
                    >
                      Friends ({counts.friend})
                    </button>
                  )}
                </div>

                <span className="text-[9px] text-text-muted font-mono shrink-0 pr-1">
                  Esc to close
                </span>
              </div>
            )}

            {/* Results Content Area */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-progress-track/30">
              {query.trim() === '' ? (
                /* Empty query state with quick keyword suggestions */
                <div className="p-4 space-y-3">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    Quick Keyword Filters
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_KEYWORDS.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => {
                          setQuery(kw);
                          setIsOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-surface-secondary/70 hover:bg-kaos-teal/20 text-kaos-teal border border-kaos-teal/20 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        #{kw}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
                    Search across all your Chennai surveyor message logs, direct teammate dialogues, squad missions, and KAOS Gemini AI logs.
                  </p>
                </div>
              ) : filteredResults.length === 0 ? (
                /* No search results matching state */
                <div className="p-8 text-center space-y-2">
                  <span className="material-symbols-outlined text-3xl text-text-muted">search_off</span>
                  <h4 className="text-xs font-bold text-kaos-offwhite">
                    No conversation records found
                  </h4>
                  <p className="text-[11px] text-text-secondary">
                    No messages, friends, or bot logs containing "{query}".
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setQuery('')}
                      className="px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-kaos-pink text-kaos-pink hover:text-white border border-kaos-pink/20 text-xs font-bold transition-all cursor-pointer"
                    >
                      Reset search filter
                    </button>
                  </div>
                </div>
              ) : (
                /* List of search results */
                filteredResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    className="w-full p-2.5 rounded-xl hover:bg-surface-secondary/60 text-left transition-all flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-surface-secondary border border-progress-track flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                      {item.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-kaos-offwhite group-hover:text-kaos-teal transition-colors truncate">
                          {highlightMatch(item.title, query)}
                        </span>
                        {item.timestamp && (
                          <span className="text-[9px] text-text-muted font-mono shrink-0">
                            {item.timestamp}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[10px] text-text-muted truncate mt-0.5">
                          {highlightMatch(item.subtitle, query)}
                        </p>
                      )}
                      <p className="text-[11px] text-text-secondary line-clamp-2 mt-1 leading-relaxed bg-background-primary/30 p-1.5 rounded-lg border border-progress-track/40">
                        {highlightMatch(item.snippet, query)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
