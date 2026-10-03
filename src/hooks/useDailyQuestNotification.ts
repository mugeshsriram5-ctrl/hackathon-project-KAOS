import { useState, useEffect, useCallback } from 'react';
import { sqlDb } from '../lib/sqlDatabase';
import { TabType } from '../components/BottomBar';

export interface DailyQuestNotificationState {
  hasNewQuests: boolean;
  uncompletedCount: number;
  isPulsing: boolean;
  acknowledgeQuests: () => void;
}

/**
 * Custom hook that monitors SQL daily_quests table and triggers a subtle UI
 * animation on the Home screen ('home' / 'Discover') tab icon whenever new or uncompleted
 * exploration objectives are waiting to be claimed.
 */
export function useDailyQuestNotification(currentTab: TabType): DailyQuestNotificationState {
  const [uncompletedCount, setUncompletedCount] = useState<number>(0);
  const [hasNewQuests, setHasNewQuests] = useState<boolean>(false);
  const [isPulsing, setIsPulsing] = useState<boolean>(false);

  const checkQuests = useCallback(() => {
    try {
      const quests = sqlDb.getDailyQuests(false);
      const uncompleted = quests.filter((q) => !q.isCompleted);
      const count = uncompleted.length;
      setUncompletedCount(count);

      const today = new Date().toISOString().split('T')[0];
      const acknowledgedDate = localStorage.getItem('kaos_quests_ack_date');
      const acknowledgedCount = parseInt(localStorage.getItem('kaos_quests_ack_count') || '0', 10);

      // Trigger subtle animation if there are uncompleted quests and either:
      // 1. It's a new day or first load
      // 2. Count increased (new quests rerolled)
      // 3. User hasn't acknowledged yet
      if (count > 0) {
        if (acknowledgedDate !== today || count > acknowledgedCount) {
          setHasNewQuests(true);
          setIsPulsing(true);
        } else {
          setHasNewQuests(false);
          setIsPulsing(false);
        }
      } else {
        setHasNewQuests(false);
        setIsPulsing(false);
      }
    } catch (e) {
      console.warn('Error reading daily quests in notification hook:', e);
    }
  }, []);

  useEffect(() => {
    checkQuests();

    const handleUpdate = () => {
      checkQuests();
    };

    window.addEventListener('kaos-daily-quests-updated', handleUpdate);
    window.addEventListener('kaos-sql-sync-change', handleUpdate);

    return () => {
      window.removeEventListener('kaos-daily-quests-updated', handleUpdate);
      window.removeEventListener('kaos-sql-sync-change', handleUpdate);
    };
  }, [checkQuests]);

  const acknowledgeQuests = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('kaos_quests_ack_date', today);
    localStorage.setItem('kaos_quests_ack_count', String(uncompletedCount));
    setIsPulsing(false);
    setHasNewQuests(false);
  }, [uncompletedCount]);

  // When user navigates to the 'explore' tab, keep the gentle notification visible briefly
  // as positive confirmation, then acknowledge after 2.5s
  useEffect(() => {
    if (currentTab === 'explore' && hasNewQuests) {
      const timer = setTimeout(() => {
        acknowledgeQuests();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentTab, hasNewQuests, acknowledgeQuests]);

  return {
    hasNewQuests,
    uncompletedCount,
    isPulsing,
    acknowledgeQuests,
  };
}
