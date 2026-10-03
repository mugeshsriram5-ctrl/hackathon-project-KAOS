export interface MasterSpot {
  id: string;
  title: string;
  category: string;
  categoryKey: string;
  zone: string;
  distance: string;
  duration: string;
  xp: number;
  description: string;
  fullStory: string;
  openHours: string;
  imageUrl: string;
  vintageYear: string;
  architecturalStyle: string;
  audioGuideScript: string;
  soundscapeType: string;
  secretPerkTitle?: string;
  lat?: number;
  lng?: number;
  rating?: number;
}

export interface PassportStamp {
  id: string;
  title: string;
  zone: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  icon: string;
  xpValue: number;
  description: string;
  unlocked: boolean;
}

export interface SecretPerk {
  id: string;
  placeName: string;
  zone: string;
  perkTitle: string;
  secretCode: string;
  secretMenuDish: string;
  perkValue: string;
  status: 'available' | 'claimed' | 'locked';
  imageUrl: string;
}

export interface TerritoryLeader {
  rank: number;
  name: string;
  xp: number;
  streak: number;
  avatar: string;
}

export interface RecommendedSpot {
  spot: MasterSpot;
  matchScore: number;
  matchReason: string;
  matchedTags: string[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  task: string;
  verification: string;
  xpReward: number;
  isCompleted: boolean;
}


export interface ActivityFeedItem {
  id: string;
  explorerId: string;
  explorerName: string;
  explorerAvatar?: string;
  actionType: 'check_in' | 'quest_completion' | 'discovery';
  locationName: string;
  zone?: string;
  timestamp: string;
  xpGained: number;
}
