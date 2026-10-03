import React, { useState, useEffect } from 'react';
import { KaosNotification, subscribeNotifications, markNotificationAsRead } from '../services/socialService';

interface NotificationsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectNotification?: (notif: KaosNotification) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  userId,
  isOpen,
  onClose,
  onSelectNotification,
}) => {
  const [notifications, setNotifications] = useState<KaosNotification[]>([]);

  useEffect(() => {
    if (!isOpen || !userId) return;
    const unsubscribe = subscribeNotifications(userId, (list) => {
      setNotifications(list);
    });
    return () => unsubscribe();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleMarkRead = (notif: KaosNotification) => {
    markNotificationAsRead(userId, notif.id);
    onSelectNotification?.(notif);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#26242C] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F05423] text-lg">notifications</span>
            <h3 className="text-base font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.2 rounded-full bg-[#F05423] text-white text-[10px] font-mono font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-zinc-600">notifications_none</span>
              <p className="text-xs font-bold text-white">All caught up!</p>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                No new alerts or explorer requests at this moment.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkRead(notif)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  !notif.read
                    ? 'bg-[#121114] border-[#F05423]/50 shadow-md'
                    : 'bg-[#121114]/50 border-[#26242C] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#1C1A1F] border border-[#26242C] flex items-center justify-center text-lg shrink-0">
                  {notif.senderAvatar || '🛡️'}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                    <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2">{notif.body}</p>
                </div>

                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-[#F05423] shrink-0 mt-1" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
