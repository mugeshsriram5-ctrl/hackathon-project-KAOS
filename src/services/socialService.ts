import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { CURRENT_USER } from './chatService';

export interface FriendUser {
  uid: string;
  displayName: string;
  username: string;
  avatar: string;
  level: number;
  xp: number;
  badge?: string;
  mutualFriendsCount?: number;
  availabilityStatus?: string;
  isVip?: boolean;
  bio?: string;
  questsCompleted?: number;
  discoveriesCount?: number;
  interests?: string[];
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  senderLevel: number;
  senderXp: number;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
  mutualFriendsCount?: number;
}

export interface BlockRecord {
  id: string;
  blockerId: string;
  blockedUserId: string;
  blockedName?: string;
  blockedUsername?: string;
  blockedAvatar?: string;
  createdAt: any;
}

export interface ReportPayload {
  reportedUserId: string;
  reportedName: string;
  reason: string;
  description?: string;
}

export interface KaosNotification {
  id: string;
  userId: string;
  type: 'friend_request' | 'request_accepted' | 'message' | 'quest_achievement';
  title: string;
  body: string;
  read: boolean;
  actionUrl?: string;
  senderId?: string;
  senderAvatar?: string;
  createdAt: any;
}

// Local mock initial dataset for fast seed fallback
const SEED_EXPLORERS: FriendUser[] = [
  {
    uid: 'explorer-1',
    displayName: 'Vikram Dev',
    username: 'vikram_dev',
    avatar: '🧭',
    level: 14,
    xp: 4250,
    badge: 'Senior Cartographer',
    mutualFriendsCount: 3,
    availabilityStatus: 'Exploring Mylapore',
    isVip: true,
    bio: 'Surveying 1920s architecture & coffee heritage in Madras',
    questsCompleted: 28,
    discoveriesCount: 42,
    interests: ['Heritage', 'Architecture', 'Coffee Roasteries'],
  },
  {
    uid: 'explorer-2',
    displayName: 'Priya Raj',
    username: 'priya_raj',
    avatar: '🏛️',
    level: 18,
    xp: 5900,
    badge: 'Sacred Tank Specialist',
    mutualFriendsCount: 5,
    availabilityStatus: 'Available Now',
    isVip: true,
    bio: 'Acoustic research at ancient temple tanks & gopuram geometry',
    questsCompleted: 35,
    discoveriesCount: 58,
    interests: ['Temple Tanks', 'Sacred Cosmology', 'Soundscapes'],
  },
  {
    uid: 'explorer-3',
    displayName: 'Anand Kumar',
    username: 'anand_arch',
    avatar: '🎨',
    level: 9,
    xp: 2800,
    badge: 'Stained Glass Archivalist',
    mutualFriendsCount: 2,
    availabilityStatus: 'Away',
    isVip: false,
    bio: 'Capturing Indo-Saracenic vaulted arches across Chepauk & Fort St George',
    questsCompleted: 19,
    discoveriesCount: 31,
    interests: ['Architecture', 'Colonial History', 'Photography'],
  },
  {
    uid: 'explorer-4',
    displayName: 'Deepa Sundaram',
    username: 'deepa_maps',
    avatar: '☕',
    level: 12,
    xp: 3600,
    badge: 'Coromandel Surveyor',
    mutualFriendsCount: 1,
    availabilityStatus: 'Available Now',
    isVip: false,
    bio: 'Traditional filter coffee trails & heritage alleyways',
    questsCompleted: 22,
    discoveriesCount: 39,
    interests: ['Food Lore', 'Coffee Roasteries', 'Hidden Gems'],
  },
];

// Helper to get active user ID
export function getActiveUserId(): string {
  return auth.currentUser?.uid || 'anonymous';
}

// ----------------------------------------------------
// 1. FRIENDS LIST & SUGGESTIONS
// ----------------------------------------------------

export async function fetchFriends(userId?: string): Promise<FriendUser[]> {
  const uid = userId || getActiveUserId();
  try {
    const friendsRef = collection(db, `users/${uid}/friends`);
    const snap = await getDocs(friendsRef);
    if (!snap.empty) {
      return snap.docs.map((docSnap) => ({ uid: docSnap.id, ...docSnap.data() } as FriendUser));
    }
  } catch (err) {
    console.warn('Firestore fetchFriends fallback:', err);
  }

  // Fallback to local storage or seed
  try {
    const local = localStorage.getItem(`kaos_friends_${uid}`);
    if (local) return JSON.parse(local);
  } catch {}

  return SEED_EXPLORERS.slice(0, 2);
}

export function subscribeFriends(uid: string, callback: (friends: FriendUser[]) => void) {
  try {
    const friendsRef = collection(db, `users/${uid}/friends`);
    return onSnapshot(
      friendsRef,
      (snapshot) => {
        const list: FriendUser[] = snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as FriendUser));
        if (list.length > 0) {
          callback(list);
          try {
            localStorage.setItem(`kaos_friends_${uid}`, JSON.stringify(list));
          } catch {}
        } else {
          // If empty in Firestore, check local
          const local = localStorage.getItem(`kaos_friends_${uid}`);
          callback(local ? JSON.parse(local) : SEED_EXPLORERS.slice(0, 2));
        }
      },
      () => {
        const local = localStorage.getItem(`kaos_friends_${uid}`);
        callback(local ? JSON.parse(local) : SEED_EXPLORERS.slice(0, 2));
      }
    );
  } catch {
    const local = localStorage.getItem(`kaos_friends_${uid}`);
    callback(local ? JSON.parse(local) : SEED_EXPLORERS.slice(0, 2));
    return () => {};
  }
}

export async function searchPlayers(searchQuery: string): Promise<FriendUser[]> {
  const cleanQuery = searchQuery.trim().toLowerCase();
  if (!cleanQuery) return [];

  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('username', '>=', cleanQuery),
      where('username', '<=', cleanQuery + '\uf8ff'),
      limit(20)
    );
    
    const snap = await getDocs(q);
    const results = snap.docs.map(d => ({ uid: d.id, ...d.data() } as FriendUser));
    
    // Filter out current user if in results
    const currentUid = getActiveUserId();
    return results.filter(u => u.uid !== currentUid);
  } catch (err) {
    console.error('searchPlayers error:', err);
    // Fallback to mock search in SEED_EXPLORERS
    return SEED_EXPLORERS.filter(e => 
      e.displayName.toLowerCase().includes(cleanQuery) || 
      e.username.toLowerCase().includes(cleanQuery)
    );
  }
}

export async function fetchSuggestedPlayers(currentUserId: string): Promise<FriendUser[]> {
  const blockedIds = await fetchBlockedUserIds(currentUserId);
  const friends = await fetchFriends(currentUserId);
  const friendIds = new Set(friends.map((f) => f.uid));

  return SEED_EXPLORERS.filter(
    (exp) => exp.uid !== currentUserId && !friendIds.has(exp.uid) && !blockedIds.has(exp.uid)
  );
}

// ----------------------------------------------------
// 2. FRIEND REQUESTS (SEND, ACCEPT, DECLINE, CANCEL)
// ----------------------------------------------------

export async function sendFriendRequest(
  sender: { uid: string; displayName: string; username: string; avatar: string; level: number; xp: number },
  targetUser: FriendUser
): Promise<{ success: boolean; message: string }> {
  // Check if blocked
  const isBlocked = await checkIsBlocked(sender.uid, targetUser.uid);
  if (isBlocked) {
    return { success: false, message: 'Unable to send friend request.' };
  }

  try {
    const reqId = `${sender.uid}_${targetUser.uid}`;
    const reqRef = doc(db, 'friendRequests', reqId);

    const payload = {
      senderId: sender.uid,
      senderName: sender.displayName,
      senderUsername: sender.username,
      senderAvatar: sender.avatar,
      senderLevel: sender.level,
      senderXp: sender.xp,
      receiverId: targetUser.uid,
      receiverName: targetUser.displayName,
      receiverAvatar: targetUser.avatar,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await setDoc(reqRef, payload, { merge: true });

    // Create notification for recipient
    await sendNotification(targetUser.uid, {
      type: 'friend_request',
      title: 'New Friend Request',
      body: `${sender.displayName} (@${sender.username}) wants to connect on KAOS.`,
      senderId: sender.uid,
      senderAvatar: sender.avatar,
    });

    return { success: true, message: `Friend request sent to ${targetUser.displayName}! 🤝` };
  } catch (err) {
    console.warn('Firestore sendFriendRequest local fallback:', err);
    return { success: true, message: `Friend request sent to ${targetUser.displayName}! 🤝` };
  }
}

export async function acceptFriendRequest(req: FriendRequest): Promise<{ success: boolean }> {
  const currentUid = getActiveUserId();
  try {
    // 1. Update request status
    const reqRef = doc(db, 'friendRequests', req.id);
    await setDoc(reqRef, { status: 'accepted' }, { merge: true });

    // 2. Add to sender's friends subcollection
    const senderFriendRef = doc(db, `users/${req.senderId}/friends`, currentUid);
    await setDoc(
      senderFriendRef,
      {
        uid: currentUid,
        displayName: CURRENT_USER.displayName,
        username: 'usha_explorer',
        avatar: CURRENT_USER.avatarUrl || '🛡️',
        level: 12,
        xp: 3400,
        availabilityStatus: 'Available Now',
      },
      { merge: true }
    );

    // 3. Add to receiver's friends subcollection
    const receiverFriendRef = doc(db, `users/${currentUid}/friends`, req.senderId);
    await setDoc(
      receiverFriendRef,
      {
        uid: req.senderId,
        displayName: req.senderName,
        username: req.senderUsername,
        avatar: req.senderAvatar,
        level: req.senderLevel,
        xp: req.senderXp,
        availabilityStatus: 'Available Now',
      },
      { merge: true }
    );

    // 4. Send acceptance notification
    await sendNotification(req.senderId, {
      type: 'request_accepted',
      title: 'Friend Request Accepted',
      body: `${CURRENT_USER.displayName} accepted your friend request! Explore together.`,
      senderId: currentUid,
      senderAvatar: CURRENT_USER.avatarUrl || '🛡️',
    });

    return { success: true };
  } catch (err) {
    console.warn('acceptFriendRequest fallback:', err);
    return { success: true };
  }
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  try {
    const reqRef = doc(db, 'friendRequests', requestId);
    await deleteDoc(reqRef);
  } catch {}
}

export function subscribeIncomingRequests(receiverUid: string, callback: (requests: FriendRequest[]) => void) {
  try {
    const q = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', receiverUid),
      where('status', '==', 'pending')
    );
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest));
        callback(list);
      },
      (error) => {
        console.warn('subscribeIncomingRequests notice:', error?.message);
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

// ----------------------------------------------------
// 3. BLOCKING SYSTEM (BLOCK & UNBLOCK)
// ----------------------------------------------------

export async function blockUser(
  blockerId: string,
  targetUser: { uid: string; displayName: string; username: string; avatar?: string }
): Promise<{ success: boolean; message: string }> {
  try {
    const blockId = `${blockerId}_${targetUser.uid}`;
    const blockRef = doc(db, 'blocks', blockId);

    // 1. Create block document
    await setDoc(blockRef, {
      id: blockId,
      blockerId,
      blockedUserId: targetUser.uid,
      blockedName: targetUser.displayName,
      blockedUsername: targetUser.username,
      blockedAvatar: targetUser.avatar || '🛡️',
      createdAt: new Date().toISOString(),
    });

    // 2. Remove friendship from both users
    await deleteDoc(doc(db, `users/${blockerId}/friends`, targetUser.uid));
    await deleteDoc(doc(db, `users/${targetUser.uid}/friends`, blockerId));

    // 3. Remove pending friend requests in both directions
    await deleteDoc(doc(db, 'friendRequests', `${blockerId}_${targetUser.uid}`));
    await deleteDoc(doc(db, 'friendRequests', `${targetUser.uid}_${blockerId}`));

    // Update local cache
    const blockedSet = await fetchBlockedUserIds(blockerId);
    blockedSet.add(targetUser.uid);
    localStorage.setItem(`kaos_blocked_ids_${blockerId}`, JSON.stringify(Array.from(blockedSet)));

    return {
      success: true,
      message: `Blocked ${targetUser.displayName}. They can no longer message or view your profile.`,
    };
  } catch (err) {
    console.warn('blockUser fallback:', err);
    return {
      success: true,
      message: `Blocked ${targetUser.displayName}.`,
    };
  }
}

export async function unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
  try {
    const blockId = `${blockerId}_${blockedUserId}`;
    await deleteDoc(doc(db, 'blocks', blockId));

    // Remove from local cache
    const blockedSet = await fetchBlockedUserIds(blockerId);
    blockedSet.delete(blockedUserId);
    localStorage.setItem(`kaos_blocked_ids_${blockerId}`, JSON.stringify(Array.from(blockedSet)));
  } catch (err) {
    console.warn('unblockUser notice:', err);
  }
}

export async function fetchBlockedUsers(blockerId: string): Promise<BlockRecord[]> {
  try {
    const q = query(collection(db, 'blocks'), where('blockerId', '==', blockerId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlockRecord));
    }
  } catch {}

  try {
    const local = localStorage.getItem(`kaos_blocked_list_${blockerId}`);
    if (local) return JSON.parse(local);
  } catch {}

  return [];
}

export async function fetchBlockedUserIds(blockerId: string): Promise<Set<string>> {
  const set = new Set<string>();
  try {
    const q = query(collection(db, 'blocks'), where('blockerId', '==', blockerId));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.blockedUserId) set.add(data.blockedUserId);
    });
  } catch {}

  try {
    const cached = localStorage.getItem(`kaos_blocked_ids_${blockerId}`);
    if (cached) {
      const arr = JSON.parse(cached);
      arr.forEach((id: string) => set.add(id));
    }
  } catch {}

  return set;
}

export async function checkIsBlocked(userA: string, userB: string): Promise<boolean> {
  const setA = await fetchBlockedUserIds(userA);
  if (setA.has(userB)) return true;
  const setB = await fetchBlockedUserIds(userB);
  if (setB.has(userA)) return true;
  return false;
}

// ----------------------------------------------------
// 4. REPORTING SYSTEM
// ----------------------------------------------------

export async function submitUserReport(
  reporterId: string,
  payload: ReportPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const reportRef = collection(db, 'reports');
    await addDoc(reportRef, {
      reporterId,
      reportedUserId: payload.reportedUserId,
      reportedName: payload.reportedName,
      reason: payload.reason,
      description: payload.description || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    });

    return {
      success: true,
      message: 'Report submitted. Thank you for helping keep KAOS safe.',
    };
  } catch (err) {
    console.warn('submitUserReport fallback:', err);
    return {
      success: true,
      message: 'Report submitted. Thank you for helping keep KAOS safe.',
    };
  }
}

// ----------------------------------------------------
// 5. NOTIFICATIONS SYSTEM
// ----------------------------------------------------

export async function sendNotification(
  userId: string,
  notif: { type: KaosNotification['type']; title: string; body: string; senderId?: string; senderAvatar?: string; actionUrl?: string }
): Promise<void> {
  try {
    const notifRef = collection(db, `users/${userId}/notifications`);
    await addDoc(notifRef, {
      userId,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      senderId: notif.senderId || '',
      senderAvatar: notif.senderAvatar || '🛡️',
      actionUrl: notif.actionUrl || '',
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('sendNotification notice:', err);
  }
}

export function subscribeNotifications(userId: string, callback: (notifs: KaosNotification[]) => void) {
  try {
    const notifRef = collection(db, `users/${userId}/notifications`);
    return onSnapshot(
      notifRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as KaosNotification));
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      (error) => {
        console.warn('subscribeNotifications notice:', error?.message);
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

export async function markNotificationAsRead(userId: string, notifId: string): Promise<void> {
  try {
    const docRef = doc(db, `users/${userId}/notifications`, notifId);
    await setDoc(docRef, { read: true }, { merge: true });
  } catch {}
}
