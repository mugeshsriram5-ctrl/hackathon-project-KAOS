import React, { useState, useEffect, useRef, useMemo } from 'react';
import { KAOS_SPOTS, KAOS_PERKS } from '../data/kaosData';
import { MasterSpot } from '../types';
import { TabType } from './BottomBar';
import { sqlDb, SearchHistoryItem } from '../lib/sqlDatabase';
import { KaosAppIcon } from './KaosAppIcon';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSpot: (spot: MasterSpot) => void;
  onNavigateTab: (tab: TabType) => void;
  onOpenSqlExplorer: () => void;
  onOpenNavRd?: () => void;
}

interface CommandItem {
  id: string;
  category: 'Landmarks' | 'Navigation' | 'Secret Perks' | 'Tools';
  title: string;
  subtitle?: string;
  badge?: string;
  icon: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectSpot,
  onNavigateTab,
  onOpenSqlExplorer,
  onOpenNavRd,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setQuery('Voice search not supported in this browser');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Voice search failed to start:', err);
      setIsListening(false);
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
  };

  // Load latest search history from SQL whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setRecentSearches(sqlDb.getRecentSearches(5));
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable commands pool
  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];

    // Navigation & Primary Hubs
    list.push(
      {
        id: 'nav-explore',
        category: 'Navigation',
        title: 'Explore & Discover Chennai',
        subtitle: 'Daily quests, recommended spots, and searchable places archive',
        icon: 'explore',
        action: () => {
          onNavigateTab('explore');
          onClose();
        },
      },
      {
        id: 'nav-map',
        category: 'Navigation',
        title: 'AR Radar & Geofence Map',
        subtitle: 'Proximity radar, beacon check-ins, and soundscape field',
        icon: 'view_in_ar',
        action: () => {
          onNavigateTab('map');
          onClose();
        },
      },
      {
        id: 'nav-assistant',
        category: 'Navigation',
        title: 'Maya AI Assistant',
        subtitle: 'Converse with your context-aware Chennai guide',
        icon: 'auto_awesome',
        action: () => {
          onNavigateTab('assistant');
          onClose();
        },
      },
      {
        id: 'nav-social',
        category: 'Navigation',
        title: 'Community & Squad Feed',
        subtitle: 'Browse discovered stories, global rankings, and friends',
        icon: 'groups',
        action: () => {
          onNavigateTab('friends');
          onClose();
        },
      },
      {
        id: 'nav-profile',
        category: 'Navigation',
        title: 'Explorer Passport',
        subtitle: 'View collected stamps, level badges, and saved places',
        icon: 'badge',
        action: () => {
          onNavigateTab('profile');
          onClose();
        },
      }
    );

    // Tools
    list.push({
      id: 'tool-sql',
      category: 'Tools',
      title: 'SQL Offline Database Vault',
      subtitle: 'Query places ledger and check offline synchronization',
      icon: 'database',
      action: () => {
        onOpenSqlExplorer();
        onClose();
      },
    });

    if (onOpenNavRd) {
      list.push({
        id: 'tool-nav-rd',
        category: 'Tools',
        title: 'Live Navigation & R&D Intelligence Radar',
        subtitle: 'Google Search grounded Chennai metro routes, opening hours, and archaeological R&D',
        icon: 'travel_explore',
        badge: 'Gemini 3.5',
        action: () => {
          onOpenNavRd();
          onClose();
        },
      });
    }

    // 1,000+ Chennai Landmarks
    KAOS_SPOTS.forEach((spot) => {
      list.push({
        id: `spot-${spot.id}`,
        category: 'Landmarks',
        title: spot.title,
        subtitle: `${spot.zone} Sector · ${spot.category}`,
        badge: `+${spot.xp} XP`,
        icon: 'location_on',
        action: () => {
          if (typeof (sqlDb as any).saveSearchQuery === 'function') {
            (sqlDb as any).saveSearchQuery(spot.title, spot.id);
          }
          onSelectSpot(spot);
          onClose();
        },
      });
    });

    // Secret Perks
    KAOS_PERKS.forEach((perk) => {
      list.push({
        id: `perk-${perk.id}`,
        category: 'Secret Perks',
        title: perk.placeName,
        subtitle: perk.perkTitle,
        badge: perk.status.toUpperCase(),
        icon: 'local_offer',
        action: () => {
          onNavigateTab('profile');
          onClose();
        },
      });
    });

    return list;
  }, [onNavigateTab, onSelectSpot, onOpenSqlExplorer, onClose]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allCommands;
    return allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [allCommands, query]);

  // Keep selected index within range
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-sans cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1C1A1F] border border-[#26242C] w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] cursor-default"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#26242C] flex items-center gap-3 bg-[#121114]">
          <KaosAppIcon size={24} withGlow={false} />
          <span className="material-symbols-outlined text-lg text-zinc-500">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isListening ? 'Listening for voice command...' : 'Type a command, landmark name, or zone (e.g. Mylapore)...'}
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none font-medium"
          />
          <button
            type="button"
            onClick={isListening ? stopVoiceSearch : startVoiceSearch}
            title="Voice Search via Web Speech API"
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-red-500/20 border border-red-500 text-red-400 animate-pulse'
                : 'bg-[#1C1A1F] hover:bg-[#26242C] border border-[#26242C] text-zinc-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {isListening ? 'mic' : 'mic_none'}
            </span>
          </button>
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-zinc-500 hover:text-white text-xs cursor-pointer px-2 shrink-0"
            >
              Clear
            </button>
          ) : (
            <kbd className="text-[10px] font-mono text-zinc-500 bg-[#1C1A1F] px-2 py-0.5 rounded border border-[#26242C] shrink-0">
              ESC
            </kbd>
          )}
        </div>

        {/* Recent Searches Header if no query */}
        {!query && recentSearches.length > 0 && (
          <div className="px-4 py-2.5 bg-[#18161D] border-b border-[#26242C] flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider font-bold">
              Recent Vault Queries
            </span>
            <button
              onClick={() => {
                sqlDb.clearSearchHistory();
                setRecentSearches([]);
              }}
              className="text-zinc-500 hover:text-rose-400 text-[10px] font-mono cursor-pointer"
            >
              Clear History
            </button>
          </div>
        )}

        {/* Command List Results */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-[#26242C]/40">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <span className="material-symbols-outlined text-3xl text-zinc-600">search_off</span>
              <p className="text-xs text-zinc-400">No matching landmarks or commands found in Vault.</p>
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full p-3 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#F05423]/20 border border-[#F05423]/60 shadow-md'
                      : 'hover:bg-[#24212c] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#F05423] text-white' : 'bg-[#121114] text-zinc-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{item.title}</span>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase px-1.5 py-0.2 rounded bg-black/40 border border-[#26242C]">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        item.badge === 'CLAIMED' || item.badge === 'AVAILABLE'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          : 'bg-[#F05423]/10 border border-[#F05423]/30 text-[#F05423]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 bg-[#121114] border-t border-[#26242C] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>KAOS Quick Finder</span>
        </div>
      </div>
    </div>
  );
};
