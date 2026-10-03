import { MasterSpot } from '../types';

export interface KaosAppContext {
  currentScreen: string;
  currentTask?: string;
  selectedSpot?: {
    id: string;
    title: string;
    category: string;
    zone: string;
    description: string;
    architecturalStyle?: string;
    vintageYear?: string;
    soundscapeType?: string;
    audioGuideSnippet?: string;
  } | null;
  activeQuest?: {
    title: string;
    task: string;
    verification?: string;
    spotTitle?: string;
  } | null;
  userProfile?: {
    level: number;
    xp: number;
    streak: number;
  };
  recentActions?: string[];
  conversationHistory?: Array<{ sender: 'user' | 'bot'; text: string }>;
}

export function buildKaosContext(
  currentScreen: string,
  selectedSpot?: MasterSpot | null,
  activeQuest?: any | null,
  userProfile?: { level: number; xp: number; streak: number },
  recentActions?: string[],
  conversationHistory?: Array<{ sender: 'user' | 'bot'; text: string }>
): KaosAppContext {
  return {
    currentScreen: currentScreen || 'explore',
    currentTask: activeQuest ? `Active Quest: ${activeQuest.title}` : 'Exploring Chennai Heritage & Soundscapes',
    selectedSpot: selectedSpot
      ? {
          id: selectedSpot.id,
          title: selectedSpot.title,
          category: selectedSpot.category,
          zone: selectedSpot.zone,
          description: selectedSpot.description,
          architecturalStyle: selectedSpot.architecturalStyle || 'Indo-Saracenic / Traditional Dravidian',
          vintageYear: selectedSpot.vintageYear || 'Historical Era / Century',
          soundscapeType: selectedSpot.soundscapeType || 'Ambient Chennai Street & Temple Bells',
          audioGuideSnippet: selectedSpot.audioGuideScript
            ? selectedSpot.audioGuideScript.substring(0, 180) + '...'
            : selectedSpot.fullStory?.substring(0, 180) + '...',
        }
      : null,
    activeQuest: activeQuest
      ? {
          title: activeQuest.title,
          task: activeQuest.task || activeQuest.description,
          spotTitle: activeQuest.spotTitle || selectedSpot?.title || 'Active Location',
        }
      : null,
    userProfile: userProfile ? { level: userProfile.level, xp: userProfile.xp, streak: userProfile.streak } : undefined,
    recentActions: recentActions ? recentActions.slice(-5) : [],
    conversationHistory: conversationHistory ? conversationHistory.slice(-8) : [],
  };
}
