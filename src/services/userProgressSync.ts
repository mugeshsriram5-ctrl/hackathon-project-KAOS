import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sqlDb } from '../lib/sqlDatabase';

export async function fetchUserProgressFromCloud(uid: string) {
  try {
    const docRef = doc(db, 'users', uid, 'progress', 'userProgress');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.explorer_progress) {
        sqlDb.setExplorerProgress(data.explorer_progress);
      }
      if (data.passport_stamps && Array.isArray(data.passport_stamps)) {
        sqlDb.setPassportStamps(data.passport_stamps);
      }
      if (data.active_quest) {
        try {
          localStorage.setItem('kaos_active_quest', JSON.stringify(data.active_quest));
        } catch {}
      }
      return data;
    }
  } catch (err) {
    console.warn('Failed to fetch user progress from cloud:', err);
  }
  return null;
}

export async function saveUserProgressToCloud(uid: string) {
  try {
    const docRef = doc(db, 'users', uid, 'progress', 'userProgress');
    const profile = sqlDb.getProfile();
    const stamps = sqlDb.getPassportStamps();
    let activeQuest = null;
    try {
      const saved = localStorage.getItem('kaos_active_quest');
      activeQuest = saved ? JSON.parse(saved) : null;
    } catch {}

    await setDoc(docRef, {
      explorer_progress: profile,
      passport_stamps: stamps,
      active_quest: activeQuest,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to save user progress to cloud:', err);
  }
}
