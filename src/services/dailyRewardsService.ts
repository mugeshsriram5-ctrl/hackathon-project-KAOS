import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { sqlDb } from '../lib/sqlDatabase';

export interface DailyRewardItem {
  day: number;
  title: string;
  subtitle: string;
  type: 'xp' | 'key' | 'speed_stim' | 'codex' | 'radar_ping' | 'cache_key';
  amount: number;
  icon: string; // Material symbol or emoji
  badge?: string;
  isMilestone?: boolean;
}

export const DAILY_REWARDS_SCHEDULE: DailyRewardItem[] = [
  {
    day: 1,
    title: '+50 XP',
    subtitle: 'Initiation Spark',
    type: 'xp',
    amount: 50,
    icon: 'auto_awesome',
  },
  {
    day: 2,
    title: '1x Relic Key',
    subtitle: '+75 XP',
    type: 'key',
    amount: 75,
    icon: 'key',
  },
  {
    day: 3,
    title: '+100 XP',
    subtitle: 'Cadet Booster',
    type: 'xp',
    amount: 100,
    icon: 'auto_awesome',
  },
  {
    day: 4,
    title: 'Radar Ping',
    subtitle: '+150 XP',
    type: 'radar_ping',
    amount: 150,
    icon: 'radar',
  },
  {
    day: 5,
    title: '2x Cache Key',
    subtitle: '+200 XP',
    type: 'cache_key',
    amount: 200,
    icon: 'lock_open',
  },
  {
    day: 6,
    title: 'Speed Stim',
    subtitle: '+250 XP',
    type: 'speed_stim',
    amount: 250,
    icon: 'bolt',
  },
  {
    day: 7,
    title: 'Archaeo Codex',
    subtitle: '+500 XP',
    type: 'codex',
    amount: 500,
    icon: 'menu_book',
    badge: 'MILESTONE',
    isMilestone: true,
  },
];

export interface DailyRewardsState {
  currentCycle: number;
  currentStreak: number;
  longestStreak: number;
  totalDaysSynchronized: number;
  claimedDays: number[]; // e.g. [1, 2, 3] for current 7-day cycle
  lastClaimDate: string | null; // Format: 'YYYY-MM-DD'
  isClaimableToday: boolean;
  todayDayIndex: number; // 1 to 7
  milestone30Claimed: boolean;
  claimHistory: Array<{
    day: number;
    cycle: number;
    claimedAt: string;
    xpAwarded: number;
    title: string;
  }>;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

export function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const STORAGE_KEY_PREFIX = 'kaos_daily_rewards_';

export function getInitialRewardsState(userId?: string): DailyRewardsState {
  const effectiveUid = userId || auth.currentUser?.uid || 'guest_user';
  const key = `${STORAGE_KEY_PREFIX}${effectiveUid}`;
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed: DailyRewardsState = JSON.parse(saved);
      const isAlreadyClaimedToday = parsed.lastClaimDate === todayStr;

      // Check if streak was broken (missed more than 1 calendar day)
      let currentStreak = parsed.currentStreak || 1;
      let claimedDays = parsed.claimedDays || [];
      let todayDayIndex = parsed.todayDayIndex || 1;
      let currentCycle = parsed.currentCycle || 1;

      if (!isAlreadyClaimedToday) {
        if (parsed.lastClaimDate && parsed.lastClaimDate !== yesterdayStr) {
          // Streak broken: reset current 7-day progress to Day 1
          currentStreak = 1;
          claimedDays = [];
          todayDayIndex = 1;
        } else if (claimedDays.length >= 7) {
          // Completed 7 days: start new cycle
          currentCycle = (parsed.currentCycle || 1) + 1;
          claimedDays = [];
          todayDayIndex = 1;
        } else {
          // Normal continuation: next day is available
          todayDayIndex = (claimedDays.length % 7) + 1;
        }
      }

      return {
        ...parsed,
        currentCycle,
        currentStreak,
        todayDayIndex,
        claimedDays,
        isClaimableToday: !isAlreadyClaimedToday,
      };
    }
  } catch (err) {
    console.warn('Failed to parse local rewards state:', err);
  }

  // Brand new user initial state (Day 1 available immediately)
  return {
    currentCycle: 1,
    currentStreak: 1,
    longestStreak: 1,
    totalDaysSynchronized: 0,
    claimedDays: [],
    lastClaimDate: null,
    isClaimableToday: true,
    todayDayIndex: 1,
    milestone30Claimed: false,
    claimHistory: [],
  };
}

export function saveRewardsState(state: DailyRewardsState, userId?: string) {
  const effectiveUid = userId || auth.currentUser?.uid || 'guest_user';
  const key = `${STORAGE_KEY_PREFIX}${effectiveUid}`;
  try {
    localStorage.setItem(key, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('kaos-daily-rewards-updated', { detail: state }));
  } catch (err) {
    console.warn('Failed to save rewards state locally:', err);
  }

  // Cloud sync if authenticated
  if (auth.currentUser && auth.currentUser.uid !== 'demo-cadet-explorer-uid') {
    const docRef = doc(db, 'users', auth.currentUser.uid, 'rewards', 'dailyCadence');
    setDoc(docRef, { ...state, updatedAt: new Date().toISOString() }, { merge: true }).catch((err) => {
      console.warn('Cloud sync error for daily rewards:', err);
    });
  }
}

export async function fetchRewardsStateFromCloud(userId: string): Promise<DailyRewardsState | null> {
  try {
    const docRef = doc(db, 'users', userId, 'rewards', 'dailyCadence');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as DailyRewardsState;
      saveRewardsState(data, userId);
      return data;
    }
  } catch (err) {
    console.warn('Failed to fetch rewards from cloud:', err);
  }
  return null;
}

export interface ClaimRewardResult {
  success: boolean;
  reward?: DailyRewardItem;
  newState?: DailyRewardsState;
  error?: string;
  xpEarned?: number;
  milestoneUnlocked?: boolean;
}

export function claimTodayReward(currentState: DailyRewardsState, userId?: string): ClaimRewardResult {
  const todayStr = getTodayDateString();

  // 1. Duplicate claim prevention
  if (currentState.lastClaimDate === todayStr || !currentState.isClaimableToday) {
    return {
      success: false,
      error: "Today's reward has already been claimed. Check back at the next reset.",
    };
  }

  const dayIndex = currentState.todayDayIndex;
  const reward = DAILY_REWARDS_SCHEDULE.find((r) => r.day === dayIndex) || DAILY_REWARDS_SCHEDULE[0];

  const newClaimedDays = [...currentState.claimedDays, dayIndex];
  const newTotalDays = currentState.totalDaysSynchronized + 1;
  const newStreak = currentState.claimedDays.length === 0 ? currentState.currentStreak : currentState.currentStreak + 1;
  const newLongestStreak = Math.max(currentState.longestStreak || 1, newStreak);

  const historyEntry = {
    day: dayIndex,
    cycle: currentState.currentCycle,
    claimedAt: new Date().toISOString(),
    xpAwarded: reward.amount,
    title: reward.title,
  };

  const newState: DailyRewardsState = {
    ...currentState,
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    totalDaysSynchronized: newTotalDays,
    claimedDays: newClaimedDays,
    lastClaimDate: todayStr,
    isClaimableToday: false,
    claimHistory: [historyEntry, ...(currentState.claimHistory || [])].slice(0, 30),
  };

  saveRewardsState(newState, userId);

  return {
    success: true,
    reward,
    newState,
    xpEarned: reward.amount,
    milestoneUnlocked: newTotalDays === 30 && !newState.milestone30Claimed,
  };
}

export function claim30DayMilestone(currentState: DailyRewardsState, userId?: string): { success: boolean; newState?: DailyRewardsState; error?: string } {
  if (currentState.totalDaysSynchronized < 30) {
    return { success: false, error: '30-Day Expedition milestone is locked. Complete 30 check-ins to unlock.' };
  }
  if (currentState.milestone30Claimed) {
    return { success: false, error: '30-Day Milestone reward has already been claimed.' };
  }

  const newState: DailyRewardsState = {
    ...currentState,
    milestone30Claimed: true,
  };

  saveRewardsState(newState, userId);
  return { success: true, newState };
}
