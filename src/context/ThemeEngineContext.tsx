import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'auto-time' | 'auto-zone' | 'dawn' | 'noon' | 'dusk' | 'night' | 'mylapore' | 'george-town' | 'marina' | 'triplicane';

interface ThemeTokens {
  accentPrimary: string;
  accentSecondary: string;
  accentTertiary: string;
  glowColor: string;
  bgPrimary: string;
  bgSecondary: string;
  surfacePrimary: string;
  surfaceSecondary: string;
  themeName: string;
  themeDescription: string;
  icon: string;
}

const THEME_PRESETS: Record<string, ThemeTokens> = {
  dawn: {
    accentPrimary: '#FF8A00',
    accentSecondary: '#FFD23F',
    accentTertiary: '#FF6B35',
    glowColor: 'rgba(255, 138, 0, 0.35)',
    bgPrimary: '#0C0A14',
    bgSecondary: '#151224',
    surfacePrimary: '#1E1A33',
    surfaceSecondary: '#292447',
    themeName: 'Dawn & Morning Mist',
    themeDescription: 'Golden amber sunrise over temple tanks and peaberry roasteries',
    icon: 'wb_twilight',
  },
  noon: {
    accentPrimary: '#00D9D9',
    accentSecondary: '#287BFF',
    accentTertiary: '#FF6B35',
    glowColor: 'rgba(0, 217, 217, 0.35)',
    bgPrimary: '#081026',
    bgSecondary: '#101C3D',
    surfacePrimary: '#172554',
    surfaceSecondary: '#1E3A8A',
    themeName: 'Coastal Sunlight',
    themeDescription: 'Brilliant electric cyan and azure coastal sunlight',
    icon: 'wb_sunny',
  },
  dusk: {
    accentPrimary: '#FF2DAA',
    accentSecondary: '#7C3AED',
    accentTertiary: '#FF3B5C',
    glowColor: 'rgba(255, 45, 170, 0.35)',
    bgPrimary: '#100B1A',
    bgSecondary: '#1A122E',
    surfacePrimary: '#261A3D',
    surfaceSecondary: '#342454',
    themeName: 'Twilight & Neon Dusk',
    themeDescription: 'Vibrant neon pink and violet twilight shadows over colonial monuments',
    icon: 'nights_stay',
  },
  night: {
    accentPrimary: '#00D9D9',
    accentSecondary: '#7C3AED',
    accentTertiary: '#39FF88',
    glowColor: 'rgba(0, 217, 217, 0.4)',
    bgPrimary: '#0B1026',
    bgSecondary: '#111832',
    surfacePrimary: '#171D35',
    surfaceSecondary: '#202744',
    themeName: 'Obsidian Cyber Night',
    themeDescription: 'Deep obsidian foundation with high-contrast cyber teal and neon accents',
    icon: 'dark_mode',
  },
  mylapore: {
    accentPrimary: '#FFD23F',
    accentSecondary: '#FF6B35',
    accentTertiary: '#FF2DAA',
    glowColor: 'rgba(255, 210, 63, 0.4)',
    bgPrimary: '#120F08',
    bgSecondary: '#1F1A10',
    surfacePrimary: '#2E2718',
    surfaceSecondary: '#3D3421',
    themeName: 'Mylapore Temple Precinct',
    themeDescription: 'Sacred turmeric gold, temple stone bronze, and festive marigold accents',
    icon: 'temple_hindu',
  },
  'george-town': {
    accentPrimary: '#00D9D9',
    accentSecondary: '#287BFF',
    accentTertiary: '#B8F500',
    glowColor: 'rgba(0, 217, 217, 0.35)',
    bgPrimary: '#0A121A',
    bgSecondary: '#121C26',
    surfacePrimary: '#1A2736',
    surfaceSecondary: '#243447',
    themeName: 'George Town Colonial Core',
    themeDescription: 'Indo-Saracenic bronze, high court teal, and mercantile blue',
    icon: 'account_balance',
  },
  marina: {
    accentPrimary: '#287BFF',
    accentSecondary: '#00D9D9',
    accentTertiary: '#B8F500',
    glowColor: 'rgba(40, 123, 255, 0.4)',
    bgPrimary: '#081224',
    bgSecondary: '#10203D',
    surfacePrimary: '#183059',
    surfaceSecondary: '#224075',
    themeName: 'Marina Coastal Promenade',
    themeDescription: 'Bay of Bengal azure, seafoam turquoise, and lighthouse amber',
    icon: 'waves',
  },
  triplicane: {
    accentPrimary: '#FF8A00',
    accentSecondary: '#FF2DAA',
    accentTertiary: '#FFD23F',
    glowColor: 'rgba(255, 138, 0, 0.35)',
    bgPrimary: '#140D0A',
    bgSecondary: '#211610',
    surfacePrimary: '#33221A',
    surfaceSecondary: '#473024',
    themeName: 'Triplicane Spice Bazaar',
    themeDescription: 'Aromatic coffee bronze, spice amber, and historic bazaar crimson',
    icon: 'coffee',
  },
};

interface ThemeEngineContextType {
  currentThemeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  activeTokens: ThemeTokens;
  activeZone: string;
  setActiveZone: (zone: string) => void;
}

const ThemeEngineContext = createContext<ThemeEngineContextType>({
  currentThemeMode: 'auto-time',
  setThemeMode: () => {},
  activeTokens: THEME_PRESETS.night,
  activeZone: 'Mylapore',
  setActiveZone: () => {},
});

export const ThemeEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentThemeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('kaos_theme_mode') as ThemeMode) || 'auto-time';
  });
  const [activeZone, setActiveZone] = useState<string>('Mylapore');

  // Determine active tokens based on mode, time of day, or zone
  const getResolvedTokens = (): ThemeTokens => {
    if (currentThemeMode === 'auto-time') {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 9) return THEME_PRESETS.dawn;
      if (hour >= 9 && hour < 16) return THEME_PRESETS.noon;
      if (hour >= 16 && hour < 19) return THEME_PRESETS.dusk;
      return THEME_PRESETS.night;
    }
    if (currentThemeMode === 'auto-zone') {
      const z = activeZone.toLowerCase();
      if (z.includes('mylapore')) return THEME_PRESETS.mylapore;
      if (z.includes('george') || z.includes('parry') || z.includes('fort')) return THEME_PRESETS['george-town'];
      if (z.includes('marina') || z.includes('beach') || z.includes('santhome')) return THEME_PRESETS.marina;
      if (z.includes('triplicane') || z.includes('bazaar')) return THEME_PRESETS.triplicane;
      return THEME_PRESETS.night;
    }
    return THEME_PRESETS[currentThemeMode] || THEME_PRESETS.night;
  };

  const activeTokens = getResolvedTokens();

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('kaos_theme_mode', mode);
  };

  // Apply CSS custom properties dynamically to :root when tokens change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-kaos-teal', activeTokens.accentPrimary);
    root.style.setProperty('--color-kaos-blue', activeTokens.accentSecondary);
    root.style.setProperty('--color-kaos-pink', activeTokens.accentTertiary);
    root.style.setProperty('--color-background-primary', activeTokens.bgPrimary);
    root.style.setProperty('--color-background-secondary', activeTokens.bgSecondary);
    root.style.setProperty('--color-surface-primary', activeTokens.surfacePrimary);
    root.style.setProperty('--color-surface-secondary', activeTokens.surfaceSecondary);
    root.style.setProperty('background-color', activeTokens.bgPrimary);
  }, [activeTokens]);

  return (
    <ThemeEngineContext.Provider value={{ currentThemeMode, setThemeMode, activeTokens, activeZone, setActiveZone }}>
      {children}
    </ThemeEngineContext.Provider>
  );
};

export const useThemeEngine = () => useContext(ThemeEngineContext);
