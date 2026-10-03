import React, { useState, useEffect } from 'react';
import { TabType } from './BottomBar';
import { sqlDb, SqlSyncInfo } from '../lib/sqlDatabase';
import { KaosAppIcon } from './KaosAppIcon';
import { fetchChennaiWeather, ChennaiWeather } from '../services/weatherService';

interface HeaderProps {
  currentTab: TabType;
  onTabSelected: (tab: TabType) => void;
  level: number;
  streak: number;
  onOpenSqlExplorer?: () => void;
  onOpenCommandPalette?: () => void;
  unreadChatCount?: number;
  onOpenThemeEngine?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabSelected,
  level,
  streak,
  onOpenSqlExplorer,
  onOpenCommandPalette,
  unreadChatCount = 0,
  onOpenThemeEngine,
}) => {
  const [syncInfo, setSyncInfo] = useState<SqlSyncInfo>(() => sqlDb.getSyncInfo());
  const [weather, setWeather] = useState<ChennaiWeather | null>(null);

  useEffect(() => {
    // Subscribe to live SQL local storage persistence events
    const unsubscribe = sqlDb.subscribeSync((info) => {
      setSyncInfo(info);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchChennaiWeather().then((w) => setWeather(w));
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#121114]/90 backdrop-blur-xl border-b border-[#26242C] px-3 sm:px-6 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Single Wordmark Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onTabSelected('home')}
            className="text-left flex items-center gap-2.5 cursor-pointer group"
            aria-label="Go to Home"
          >
            <KaosAppIcon size={30} className="group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black text-white tracking-tight leading-none">KAOS</span>
              <span className="text-[8px] font-mono font-bold text-[#F05423] tracking-widest uppercase">Chennai Grid</span>
            </div>
          </button>
        </div>

        {/* Zone 2: Contextual Controls & Quick Actions (No duplicate primary nav) */}
        <div className="flex items-center gap-2">
          {/* Chennai Weather Widget */}
          {weather && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#18161D] border shadow-sm transition-all select-none group cursor-default ${
                weather.weatherCode >= 51 && weather.weatherCode <= 67
                  ? 'border-kaos-teal/40 text-kaos-teal shadow-[0_0_15px_rgba(20,255,236,0.15)]'
                  : weather.weatherCode >= 95
                  ? 'border-kaos-purple/40 text-kaos-purple shadow-[0_0_15px_rgba(157,78,221,0.15)]'
                  : 'border-[#26242C] text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
              }`}
              title={`Chennai Live Weather: ${weather.condition}, ${weather.temperature}°C`}
            >
              <span className="text-sm animate-pulse flex items-center justify-center">
                {weather.icon}
              </span>
              <div className="flex flex-col sm:flex-row items-baseline gap-1">
                <span className="text-[11px] font-mono font-extrabold tracking-tight">
                  {weather.temperature}°C
                </span>
                <span className="text-[9px] font-mono text-zinc-400 hidden sm:inline">
                  {weather.condition}
                </span>
              </div>
            </div>
          )}

          {/* Quick Command Palette Trigger (Cmd+K) */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#18161D] hover:bg-[#24212c] border border-[#26242C] hover:border-[#F05423]/50 text-zinc-400 hover:text-white transition-all cursor-pointer shadow-sm group"
              title="Search landmarks, zones, quests, and secret perks (⌘K)"
              aria-label="Search landmarks and quests"
            >
              <span className="material-symbols-outlined text-[16px] text-zinc-400 group-hover:text-[#F05423] transition-colors">
                search
              </span>
              <span className="text-xs hidden sm:inline">Search</span>
              <kbd className="hidden md:inline text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#121114] border border-[#26242C] text-zinc-500 group-hover:text-zinc-300">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Dynamic Theme Engine Trigger */}
          {onOpenThemeEngine && (
            <button
              onClick={onOpenThemeEngine}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#18161D] hover:bg-[#24212c] border border-[#26242C] hover:border-[#F05423]/50 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-sm"
              title="KAOS Dynamic Theme Engine (Time-of-Day & Area Accents)"
              aria-label="Open Theme Engine"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">palette</span>
            </button>
          )}

          {/* Pure Offline Safe & Sync Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#18161D] border transition-all duration-300 shadow-sm select-none ${
              syncInfo.state === 'syncing'
                ? 'border-[#F05423]/60 shadow-[0_0_15px_rgba(240,84,35,0.25)]'
                : 'border-[#26242C]'
            }`}
            title="Your progress, stamps, and custom trails are synchronized and saved offline on your device"
          >
            <div className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0">
              {syncInfo.state === 'syncing' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F05423] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F05423]" />
                </>
              ) : syncInfo.state === 'error' ? (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </>
              )}
            </div>

            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono leading-none">
              <span className="font-bold text-zinc-400">Vault</span>
              <span className="text-zinc-600 hidden xs:inline">•</span>
              {syncInfo.state === 'syncing' ? (
                <span className="text-[#F05423] font-bold animate-pulse hidden xs:inline">Syncing...</span>
              ) : (
                <span className="text-emerald-400 font-semibold hidden xs:inline">Saved</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
