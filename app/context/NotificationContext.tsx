"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import useNotificationServices from "../hooks/use-notification";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Notification = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  sender_name: string;
  created_at: string;
  profile_pic: {
    url: string;
  };
  username: string;
};

type NotificationContextType = {
  notifications: Notification[];
  pushNotification: (n: Notification) => void;
  clearConversationNotifications: (conversationId: string) => void;
  incrementUnread: (userId: string) => void;
  resetUnread: (userId: string) => void;
  decrementUnread: (userId: string) => void;
  markAllAsRead: () => void;
  totalUnread: number;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const queryClient = useQueryClient();
  const { getNotifications, unreadSummary } = useNotificationServices();
  const { data } = unreadSummary();
  const { data: count } = getNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);

  // PUSH NOTIFICATION
  const pushNotification = useCallback((n: Notification) => {
    setNotifications((prev) => [n, ...prev]);
  }, []);

  useEffect(() => {
    const computeTotal = () => {
      const data = queryClient.getQueryData<any>(["conversations"]);
      if (!data?.pages) return 0;
      return data.pages.reduce((acc: number, page: any) => {
        return (
          acc +
          (page.items?.reduce(
            (sum: number, item: any) => sum + (item.unread_count || 0),
            0,
          ) || 0)
        );
      }, 0);
    };

    // Run once on mount
    setTotalUnread(computeTotal());

    // Subscribe to any cache change on conversations
    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.queryKey?.[0] === "conversations") {
        setTotalUnread(computeTotal());
      }
    });

    return unsub;
  }, [queryClient]);

  // INCREMENT UNREAD
  const incrementUnread = useCallback(
    (userId: string) => {
      queryClient.setQueryData(["conversations"], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((c: any) =>
              c.user?.id === userId
                ? {
                    ...c,
                    unread_count: (c.unread_count || 0) + 1,
                  }
                : c,
            ),
          })),
        };
      });
    },
    [queryClient],
  );

  // RESET UNREAD (when chat is opened)
  const resetUnread = useCallback(async (userId: string) => {
    await queryClient.cancelQueries({ queryKey: ["conversations"] });
    queryClient.setQueryData(["conversations"], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          items: page.items.map((c: any) =>
            c.user?.id === userId ? { ...c, unread_count: 0 } : c,
          ),
        })),
      };
    });
  }, []);

  // CLEAR NOTIFICATIONS FOR CHAT
  const clearConversationNotifications = useCallback((userId: string) => {
    setNotifications((prev) => prev.filter((n) => n.sender_id !== userId));
  }, []);

  // MARK ALL READ
  const markAllAsRead = useCallback(() => {
    setNotifications([]);
  }, []);
  const decrementUnread = useCallback((userId: string) => {
    queryClient.setQueryData(["conversations"], (old: any) => {
      if (!old) return old;

      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          items: page.items.map((c: any) =>
            c.user?.id === userId
              ? {
                  ...c,
                  unread_count: Math.max(c.unread_count - 1, 0),
                }
              : c,
          ),
        })),
      };
    });
  }, []);

  const { data: conversationData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => null,
    enabled: false,
  });

  return (
    <NotificationContext.Provider
      value={{
        notifications,
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
