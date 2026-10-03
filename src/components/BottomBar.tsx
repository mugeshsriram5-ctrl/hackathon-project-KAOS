import React from 'react';

export type TabType = 'home' | 'map' | 'friends' | 'squads' | 'profile' | 'explore' | 'assistant';

interface BottomBarProps {
  currentTab: TabType;
  onTabSelected: (tab: TabType) => void;
  unreadChatCount?: number;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  currentTab,
  onTabSelected,
}) => {
  // Primary navigation destinations (Messages removed):
  // 1. Home -> 2. AR Radar -> 3. Friends -> 4. Squads -> 5. Profile
  const tabs = [
    { key: 'home' as TabType, label: 'Home', icon: 'home', activeColor: 'text-[#F05423]', activeBg: 'bg-[#F05423]/10' },
    { key: 'map' as TabType, label: 'AR Radar', icon: 'view_in_ar', activeColor: 'text-kaos-orange', activeBg: 'bg-kaos-orange/10' },
    { key: 'friends' as TabType, label: 'Friends', icon: 'group', activeColor: 'text-kaos-teal', activeBg: 'bg-kaos-teal/10' },
    { key: 'squads' as TabType, label: 'Squads', icon: 'shield', activeColor: 'text-kaos-purple', activeBg: 'bg-kaos-purple/10' },
    { key: 'profile' as TabType, label: 'Profile', icon: 'person', activeColor: 'text-amber-400', activeBg: 'bg-amber-400/10' },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#121114]/95 backdrop-blur-2xl border-t border-[#26242C] px-1.5 py-1.5 flex items-center justify-around w-full max-w-xl mx-auto md:max-w-3xl rounded-t-2xl shadow-2xl safe-area-inset-bottom"
      role="navigation"
      aria-label="Main Navigation"
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onTabSelected(tab.key)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[44px] ${
              isActive
                ? `${tab.activeColor} ${tab.activeBg} font-black scale-105 shadow-xs`
                : 'text-zinc-400 hover:text-white font-medium hover:bg-white/5'
            }`}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Top active indicator line/pill */}
            {isActive && (
              <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-current shadow-sm" />
            )}

            {/* Tab Icon with active indicator */}
            <span className="relative flex items-center justify-center">
              <span
                className={`material-symbols-outlined text-[20px] transition-transform ${
                  isActive ? 'fill-current' : ''
                }`}
              >
                {tab.icon}
              </span>
            </span>

            <span className="text-[9.5px] sm:text-[10px] tracking-tight truncate leading-tight">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomBar;
