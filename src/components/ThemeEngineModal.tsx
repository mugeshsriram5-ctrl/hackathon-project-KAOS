import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KaosAppIcon } from './KaosAppIcon';
import { useThemeEngine, ThemeMode } from '../context/ThemeEngineContext';

interface ThemeEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ThemeEngineModal: React.FC<ThemeEngineModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const { currentThemeMode, setThemeMode, activeTokens, activeZone, setActiveZone } = useThemeEngine();

  if (!isOpen) return null;

  const themes: Array<{ id: ThemeMode; title: string; subtitle: string; icon: string; category: 'automatic' | 'time' | 'zone' }> = [
    {
      id: 'auto-time',
      title: 'Automatic Time-of-Day',
      subtitle: 'Shifts accent colors dynamically based on local clock (Dawn, Noon, Dusk, Night)',
      icon: 'schedule',
      category: 'automatic',
    },
    {
      id: 'auto-zone',
      title: 'Active Exploration Area',
      subtitle: `Adapts to your current zone (${activeZone})`,
      icon: 'location_searching',
      category: 'automatic',
    },
    {
      id: 'dawn',
      title: 'Dawn & Morning Mist',
      subtitle: 'Golden amber sunrise over temple tanks and coffee roasteries',
      icon: 'wb_twilight',
      category: 'time',
    },
    {
      id: 'noon',
      title: 'Coastal Sunlight',
      subtitle: 'Brilliant electric cyan and azure coastal sunlight',
      icon: 'wb_sunny',
      category: 'time',
    },
    {
      id: 'dusk',
      title: 'Twilight & Neon Dusk',
      subtitle: 'Vibrant neon pink and violet twilight shadows',
      icon: 'nights_stay',
      category: 'time',
    },
    {
      id: 'night',
      title: 'Obsidian Cyber Night',
      subtitle: 'Deep obsidian foundation with cyber teal and neon accents',
      icon: 'dark_mode',
      category: 'time',
    },
    {
      id: 'mylapore',
      title: 'Mylapore Temple Precinct',
      subtitle: 'Turmeric gold, temple stone bronze, and festive marigold',
      icon: 'temple_hindu',
      category: 'zone',
    },
    {
      id: 'george-town',
      title: 'George Town Colonial Core',
      subtitle: 'Indo-Saracenic bronze and high court teal',
      icon: 'account_balance',
      category: 'zone',
    },
    {
      id: 'marina',
      title: 'Marina Coastal Promenade',
      subtitle: 'Bay of Bengal azure and seafoam turquoise',
      icon: 'waves',
      category: 'zone',
    },
    {
      id: 'triplicane',
      title: 'Triplicane Spice Bazaar',
      subtitle: 'Aromatic coffee bronze and spice amber',
      icon: 'coffee',
      category: 'zone',
    },
  ];

  const zones = ['Mylapore Precinct', 'George Town Core', 'Marina Promenade', 'Triplicane Bazaar', 'Guindy Sector'];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1C1A1F] border border-[#26242C] w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto flex flex-col cursor-default relative my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#26242C] pb-4">
          <div className="flex items-center gap-3">
            <KaosAppIcon size={40} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  KAOS Dynamic Theme Engine
                </h3>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${activeTokens.accentPrimary}20`, color: activeTokens.accentPrimary, border: `1px solid ${activeTokens.accentPrimary}40` }}
                >
                  Active: {activeTokens.themeName}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Extends design tokens and shifts accent colors based on time of day or exploration zone
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Active Zone Quick Selector (if auto-zone is active) */}
        {currentThemeMode === 'auto-zone' && (
          <div className="p-3.5 rounded-2xl bg-[#121114] border border-[#26242C] space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
              Simulate Active Exploration Area:
            </span>
            <div className="flex flex-wrap gap-2">
              {zones.map((z) => (
                <button
                  key={z}
                  onClick={() => {
                    setActiveZone(z);
                    onShowToast(`Active zone updated to ${z}! 🧭`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeZone === z
                      ? 'bg-white text-black font-extrabold shadow-md'
                      : 'bg-[#1C1A1F] text-zinc-300 hover:text-white border border-[#26242C]'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Theme Grid */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">
            Select Theme Engine Mode:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((t) => {
              const isSelected = currentThemeMode === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setThemeMode(t.id);
                    onShowToast(`Theme engine switched to ${t.title}! ✨`);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group ${
                    isSelected
                      ? 'bg-[#121114] border-white/40 shadow-xl ring-1 ring-white/20'
                      : 'bg-[#121114]/60 hover:bg-[#121114] border-[#26242C] hover:border-white/20'
                  }`}
                >
                  {isSelected && (
                    <div
                      className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-25"
                      style={{ backgroundColor: activeTokens.accentPrimary }}
                    />
                  )}

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isSelected ? activeTokens.accentPrimary : '#1C1A1F', color: isSelected ? '#000' : '#AAB3CC' }}
                      >
                        <span className="material-symbols-outlined text-base">{t.icon}</span>
                      </div>
                      <h4 className="text-xs font-black text-white tracking-tight">{t.title}</h4>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed relative z-10">
                    {t.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Token Preview Bar */}
        <div className="p-4 rounded-2xl bg-[#121114] border border-[#26242C] space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
            Active Design System Tokens:
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full border border-white/20 inline-block" style={{ backgroundColor: activeTokens.accentPrimary }} />
              <span className="text-[10px] font-mono text-zinc-300">Accent 1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full border border-white/20 inline-block" style={{ backgroundColor: activeTokens.accentSecondary }} />
              <span className="text-[10px] font-mono text-zinc-300">Accent 2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full border border-white/20 inline-block" style={{ backgroundColor: activeTokens.accentTertiary }} />
              <span className="text-[10px] font-mono text-zinc-300">Accent 3</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full border border-white/20 inline-block" style={{ backgroundColor: activeTokens.bgPrimary }} />
              <span className="text-[10px] font-mono text-zinc-300">Foundation</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ThemeEngineModal;
