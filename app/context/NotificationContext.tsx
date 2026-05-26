"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import useNotificationServices from "../hooks/use-notification";
import { useQueryClient } from "@tanstack/react-query";
import {
  Notification,
  NotificationContextType,
} from "../_utils/types/notification";

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const queryClient = useQueryClient();
  const { unreadSummary } = useNotificationServices();
  const { data: summary } = unreadSummary();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);

  // Helper to calculate total unread across both chats and system notifications
  const calculateTotal = useCallback(() => {
    const chatData = queryClient.getQueryData<any>(["conversations"]);
    const chatUnread =
      chatData?.pages?.reduce(
        (acc: number, page: any) =>
          acc +
          (page.items?.reduce(
            (sum: number, item: any) => sum + (item.unread_count || 0),
            0,
          ) || 0),
        0,
      ) || 0;

    const systemUnread = summary?.notifications?.unread_count || 0;
    return chatUnread + systemUnread;
  }, [queryClient, summary]);

  // Keep totalUnread in sync with cache
  useEffect(() => {
    setTotalUnread(calculateTotal());
    const unsub = queryClient
      .getQueryCache()
      .subscribe(() => setTotalUnread(calculateTotal()));
    return unsub;
  }, [calculateTotal, queryClient]);

  const pushNotification = useCallback((n: Notification) => {
    setNotifications((prev) => [n, ...prev]);
    if (n.event_type === "chat_message" && n.payload?.sender) {
      incrementUnread(n.payload.sender.id);
    }
  }, []);

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
                ? { ...c, unread_count: (c.unread_count || 0) + 1 }
                : c,
            ),
          })),
        };
      });
    },
    [queryClient],
  );

  const resetUnread = useCallback(
    async (userId: string) => {
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
    },
    [queryClient],
  );

  const decrementUnread = useCallback(
    (userId: string) => {
      queryClient.setQueryData(["conversations"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((c: any) =>
              c.user?.id === userId
                ? { ...c, unread_count: Math.max(c.unread_count - 1, 0) }
                : c,
            ),
          })),
        };
      });
    },
    [queryClient],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        totalUnread,
        pushNotification,
        resetUnread,
        incrementUnread,
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
