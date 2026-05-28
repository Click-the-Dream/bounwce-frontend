"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useNotificationServices from "../hooks/use-notification";
import {
  Notification,
  NotificationContextType,
} from "../_utils/types/notification";
import { syncEntity } from "../helpers/db-sync";
import { useAuth } from "./AuthContext";
import { getChatDB } from "../store/chat-store";

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const queryClient = useQueryClient();
  const { authDetails } = useAuth();
  const currentUser = authDetails?.user;

  const chatDB = useMemo(
    () => (currentUser ? getChatDB(currentUser.id) : null),
    [currentUser],
  );
  const { getNotifications, unreadSummary } = useNotificationServices();

  // 1. Reactive System Unread
  const { data: summary } = unreadSummary();
  const systemUnread = summary?.notifications?.unread_count || 0;

  // 2. Reactive Chat Conversations (Replaces manual getQueryData)
  const { data: conversations }: any = useQuery({
    queryKey: ["conversations"],
    queryFn: () => queryClient.getQueryData(["conversations"]),
    enabled: !!currentUser,
    staleTime: Infinity,
  });

  const chatUnread = useMemo(() => {
    if (!conversations?.pages) return 0;
    return conversations.pages.reduce((acc: number, page: any) => {
      const pageTotal =
        page?.items?.reduce(
          (sum: number, item: any) => sum + (item.unread_count || 0),
          0,
        ) || 0;
      return acc + pageTotal;
    }, 0);
  }, [conversations]);

  // 3. Reactive Notifications
  const {
    data: notificationPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = getNotifications();
  const notifications = useMemo(
    () =>
      notificationPages?.pages?.flatMap((p: any) => p.data?.items || []) || [],
    [notificationPages],
  );

  // 4. Mutation Helpers (Interact directly with the Cache)
  const incrementUnread = useCallback(
    async (userId: string) => {
      if (!chatDB) return;
      await syncEntity({
        db: chatDB,
        queryClient,
        store: "conversations",
        key: "user_id",
        keyValue: userId,
        queryKey: ["conversations"],
        predicate: (c: any) => c.user?.id === userId || c.id === userId,
        updater: (c: any) => ({
          ...c,
          unread_count: (c.unread_count || 0) + 1,
        }),
      });
    },
    [queryClient, chatDB],
  );

  const decrementUnread = useCallback(
    async (userId: string) => {
      if (!chatDB) return;
      await syncEntity({
        db: chatDB,
        queryClient,
        store: "conversations",
        key: "user_id",
        keyValue: userId,
        queryKey: ["conversations"],
        predicate: (c: any) => c.user?.id === userId || c.id === userId,
        updater: (c: any) => ({
          ...c,
          unread_count: Math.max((c.unread_count || 0) - 1, 0),
        }),
      });
    },
    [queryClient, chatDB],
  );

  const resetUnread = useCallback(
    async (userId: string) => {
      if (!chatDB) return;
      await syncEntity({
        db: chatDB,
        queryClient,
        store: "conversations",
        key: "user_id",
        keyValue: userId,
        queryKey: ["conversations"],
        predicate: (c: any) => c.user?.id === userId || c.id === userId,
        updater: (c: any) => ({ ...c, unread_count: 0 }),
      });
    },
    [queryClient, chatDB],
  );

  const pushNotification = useCallback(
    (n: Notification) => {
      queryClient.setQueryData(["notifications"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any, i: number) =>
            i === 0
              ? {
                  ...page,
                  data: {
                    ...page.data,
                    items: [n, ...(page.data?.items || [])],
                  },
                }
              : page,
          ),
        };
      });

      if (n.event_type === "chat_message" && n.payload?.sender) {
        incrementUnread(n.payload.sender.id);
      }
    },
    [queryClient, incrementUnread],
  );

  const totalUnread = useMemo(
    () => chatUnread + systemUnread,
    [chatUnread, systemUnread],
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
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
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
