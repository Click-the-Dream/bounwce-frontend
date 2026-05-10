"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

type Notification = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  sender_name: string;
  created_at: string;
};

type UnreadMap = Record<string, number>;

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: UnreadMap;

  pushNotification: (n: Notification) => void;
  clearConversationNotifications: (conversationId: string) => void;
  incrementUnread: (conversationId: string) => void;
  resetUnread: (conversationId: string) => void;
  decrementUnread: (conversationId: string) => void;
  markAllAsRead: () => void;
  totalUnread: number;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<UnreadMap>({});

  // PUSH NOTIFICATION
  const pushNotification = useCallback((n: Notification) => {
    setNotifications((prev) => [n, ...prev]);
  }, []);

  // INCREMENT UNREAD
  const incrementUnread = useCallback((userId: string) => {
    setUnreadCount((prev) => ({
      ...prev,
      [userId]: (prev[userId] || 0) + 1,
    }));
  }, []);

  // RESET UNREAD (when chat is opened)
  const resetUnread = useCallback((userId: string) => {
    setUnreadCount((prev) => ({
      ...prev,
      [userId]: 0,
    }));
  }, []);

  // CLEAR NOTIFICATIONS FOR CHAT
  const clearConversationNotifications = useCallback((userId: string) => {
    setNotifications((prev) => prev.filter((n) => n.sender_id !== userId));
  }, []);

  // MARK ALL READ
  const markAllAsRead = useCallback(() => {
    setNotifications([]);
    setUnreadCount({});
  }, []);
  const decrementUnread = useCallback((userId: string) => {
    setUnreadCount((prev) => {
      const current = prev[userId] || 0;

      return {
        ...prev,
        [userId]: Math.max(current - 1, 0),
      };
    });
  }, []);

  const totalUnread = useMemo(() => {
    return Object.values(unreadCount).reduce((a, b) => a + b, 0);
  }, [unreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        pushNotification,
        clearConversationNotifications,
        incrementUnread,
        resetUnread,
        markAllAsRead,
        totalUnread,
        decrementUnread,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  return ctx;
};
