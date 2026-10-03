import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  where,
  serverTimestamp,
  FieldValue,
  getDocs,
  writeBatch,
  arrayUnion
} from 'firebase/firestore';
import { 
  Conversation, 
  ChatMessage, 
  ChatUser, 
  ChatAttachment, 
  MessageType 
} from '../types/chat';

export type { Conversation, ChatMessage as Message, ChatUser };

export const subscribeConversations = (userId: string, callback: (conversations: Conversation[]) => void) => {
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const convs = snapshot.docs.map(doc => {
        const data = doc.data();
        let updatedAt = data.updatedAt;
        if (updatedAt && typeof updatedAt.toDate === 'function') {
          updatedAt = updatedAt.toDate().toISOString();
        }
        return { id: doc.id, ...data, updatedAt } as Conversation;
      });
      // Sort in client-side memory to avoid composite index errors
      convs.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      callback(convs);
    },
    (error) => {
      console.warn('subscribeConversations snapshot error:', error);
      callback([]);
    }
  );
};

export const getMessagesQuery = (conversationId: string) => {
  return query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
};

export const subscribeToMessages = (conversationId: string, callback: (messages: ChatMessage[]) => void) => {
  const q = getMessagesQuery(conversationId);
  return onSnapshot(
    q,
    (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toDate === 'function') {
          createdAt = createdAt.toDate().toISOString();
        }
        return { id: doc.id, ...data, createdAt } as ChatMessage;
      });
      callback(msgs);
    },
    (error) => {
      console.warn('subscribeToMessages snapshot error:', error);
      callback([]);
    }
  );
};

export const sendMessage = async (
  conversationId: string, 
  sender: ChatUser, 
  text: string, 
  attachment?: ChatAttachment
) => {
  const messageData: Omit<ChatMessage, 'id'> = {
    conversationId,
    senderId: sender.id,
    senderName: sender.displayName,
    senderAvatar: sender.avatarUrl,
    messageType: attachment ? attachment.type : 'text',
    text,
    attachment,
    status: 'sent',
    createdAt: serverTimestamp() as any
  };

  const msgRef = await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);
  
  // Update conversation last message
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: {
      text,
      senderId: sender.id,
      senderName: sender.displayName,
      createdAt: new Date().toISOString(),
      messageType: messageData.messageType
    },
    updatedAt: serverTimestamp()
  });

  return msgRef;
};

export const deleteConversation = async (conversationId: string) => {
  return deleteDoc(doc(db, 'conversations', conversationId));
};

export const markMessagesAsRead = async (conversationId: string, currentUserId: string) => {
  try {
    const allMsgs = await getDocs(collection(db, 'conversations', conversationId, 'messages'));
    const batch = writeBatch(db);
    let count = 0;
    allMsgs.docs.forEach((d) => {
      const data = d.data();
      if (data.senderId !== currentUserId && data.status !== 'read') {
        batch.update(d.ref, {
          status: 'read',
          readAt: serverTimestamp(),
          readBy: arrayUnion(currentUserId)
        });
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    console.warn('Real-time markMessagesAsRead error:', err);
  }
};

export const markConversationAsRead = async (conversationId: string, currentUserId?: string) => {
  try {
    await updateDoc(doc(db, 'conversations', conversationId), { unreadCount: 0 });
    if (currentUserId) {
      await markMessagesAsRead(conversationId, currentUserId);
    }
  } catch (err) {
    console.warn('markConversationAsRead error:', err);
  }
};

export const archiveConversation = async (conversationId: string) => {
  return updateDoc(doc(db, 'conversations', conversationId), { archived: true });
};

export const createDirectConversation = async (userId: string, targetUser: ChatUser) => {
  return addDoc(collection(db, 'conversations'), {
    type: 'direct',
    participantIds: [userId, targetUser.id],
    name: targetUser.displayName,
    imageUrl: targetUser.avatarUrl,
    unreadCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: {
      text: 'Started a new conversation',
      senderId: userId,
      senderName: '',
      createdAt: new Date().toISOString()
    }
  });
};

export const setTypingStatus = async (conversationId: string, userId: string, isTyping: boolean) => {
  return updateDoc(doc(db, 'conversations', conversationId), {
    [`typingStatus.${userId}`]: isTyping
  });
};

export const subscribeToConversation = (conversationId: string, callback: (conversation: Conversation) => void) => {
  return onSnapshot(doc(db, 'conversations', conversationId), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      let updatedAt = data.updatedAt;
      if (updatedAt && typeof updatedAt.toDate === 'function') {
        updatedAt = updatedAt.toDate().toISOString();
      }
      callback({ id: snapshot.id, ...data, updatedAt } as Conversation);
    }
  });
};

export const CURRENT_USER: ChatUser = {
  id: 'usha_baskar_explorer',
  displayName: 'Usha Baskar',
  avatarUrl: 'https://i.pravatar.cc/150?u=usha_baskar_explorer'
};

export const EXPLORER_DIRECTORY: ChatUser[] = [
  { id: 'vikram_dev', displayName: 'Vikram Dev', avatarUrl: 'https://i.pravatar.cc/150?u=vikram_dev', role: 'Explorer' },
  { id: 'priya_raj', displayName: 'Priya Raj', avatarUrl: 'https://i.pravatar.cc/150?u=priya_raj', role: 'Researcher' }
];

