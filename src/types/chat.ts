export type ConversationType = 'direct' | 'group';

export type MessageType = 'text' | 'image' | 'place' | 'quest' | 'trail' | 'map_location';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface ChatUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isOnline?: boolean;
  lastSeen?: string;
  role?: string;
}

export interface ChatAttachment {
  type: MessageType;
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  extraData?: {
    lat?: number;
    lng?: number;
    zone?: string;
    objective?: string;
    estimatedMinutes?: number;
    category?: string;
  };
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  messageType: MessageType;
  text: string;
  attachment?: ChatAttachment;
  status: MessageStatus;
  createdAt: string; // ISO string or timestamp string
  readBy?: string[];
  isFailed?: boolean;
}

export interface ConversationMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  lastReadTimestamp?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  imageUrl?: string;
  createdBy: string;
  participantIds: string[];
  mutedUserIds?: string[];
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    createdAt: string;
    messageType?: MessageType;
  };
  updatedAt: string;
  unreadCount?: number;
  typingStatus?: { [userId: string]: boolean };
}
