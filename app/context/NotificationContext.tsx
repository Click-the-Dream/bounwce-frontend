"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";

import { useQueryClient } from "@tanstack/react-query";
import useNotificationServices from "../hooks/use-notification";
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

  const { getNotifications, unreadSummary } = useNotificationServices();

  // SYSTEM UNREAD (reactive query)
  const { data: summary } = unreadSummary();

  // NOTIFICATIONS LIST
  const {
    data: notificationPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = getNotifications();

  // FLATTEN NOTIFICATIONS
  const notifications = useMemo(() => {
    if (!notificationPages?.pages) return [];

    return notificationPages.pages.flatMap(
      (page: any) => page.data?.items || [],
    );
  }, [notificationPages]);

  // CHAT UNREAD HANDLER
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
                ? {
                    ...c,
                    unread_count: Math.max((c.unread_count || 0) - 1, 0),
                  }
                : c,
            ),
          })),
        };
      });
    },
    [queryClient],
  );

  // RESET UNREAD (IMPORTANT FIX)
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

      queryClient.setQueryData(["unread-summary"], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          notifications: {
            ...old.notifications,
            unread_count: Math.max(
              (old.notifications?.unread_count || 0) - 3,
              0,
            ),
          },
        };
      });
    },
    [queryClient],
  );

  // PUSH NOTIFICATION
  const pushNotification = useCallback(
    (n: Notification) => {
      queryClient.setQueryData(["notifications"], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any, index: number) => {
            if (index === 0) {
              return {
                ...page,
                data: {
                  ...page.data,
                  items: [n, ...(page.data?.items || [])],
                },
              };
            }
            return page;
          }),
        };
      });

      if (n.event_type === "chat_message" && n.payload?.sender) {
        incrementUnread(n.payload.sender.id);
      }
    },
    [queryClient, incrementUnread],
  );

  const totalUnread = useMemo(() => {
    const chatData = queryClient.getQueryData<any>(["conversations"]);

    const chatUnread =
      chatData?.pages?.reduce((acc: number, page: any) => {
        return (
          acc +
          (page.items?.reduce(
            (sum: number, item: any) => sum + (item.unread_count || 0),
            0,
          ) || 0)
        );
      }, 0) || 0;

    const systemUnread = summary?.notifications?.unread_count || 0;

    return chatUnread + systemUnread;
  }, [queryClient.getQueryData(["conversations"]), summary]);

  // CONTEXT VALUE
  const value: NotificationContextType = {
    notifications,
    totalUnread,

    pushNotification,
    resetUnread,
    incrementUnread,
    decrementUnread,

    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);

  if (!ctx) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  }

  return ctx;
};
