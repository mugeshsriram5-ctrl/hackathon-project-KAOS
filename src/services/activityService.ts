import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ActivityFeedItem } from '../types';

export const subscribeToActivityFeed = (callback: (items: ActivityFeedItem[]) => void) => {
  const q = query(
    collection(db, 'activityFeed'),
    orderBy('timestamp', 'desc'),
    limit(30)
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      let timestamp = data.timestamp;
      if (timestamp && typeof timestamp.toDate === 'function') {
        timestamp = timestamp.toDate().toISOString();
      }
      return { id: doc.id, ...data, timestamp } as ActivityFeedItem;
    });
    callback(items);
  });
};

export const logActivity = async (item: Omit<ActivityFeedItem, 'id' | 'timestamp'>) => {
  try {
    await addDoc(collection(db, 'activityFeed'), {
      ...item,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
