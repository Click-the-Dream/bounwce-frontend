"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";

import { useQueryClient } from "@tanstack/react-query";
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

  // Use useMemo to safely get the DB only when the user exists
  const chatDB = useMemo(() => {
    if (!currentUser) return null;
    return getChatDB(currentUser.id);
  }, [currentUser]);

  const { getNotifications, unreadSummary } = useNotificationServices();

  // SYSTEM UNREAD (reactive query)
  const { data: summary } = unreadSummary();
  const [unreadTick, setUnreadTick] = React.useState(0);

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

  // SUBSCRIBE TO CONVERSATIONS CACHE (no queryFn needed)
  const conversationsData =
    queryClient.getQueriesData({
      queryKey: ["conversations"],
    }) || [];

  // CHAT UNREAD HANDLER
  const incrementUnread = useCallback(
    async (userId: string) => {
      if (!chatDB) return;

      syncEntity({
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
      setUnreadTick((t) => t + 1);
    },

    [queryClient],
  );

  const decrementUnread = useCallback(
    async (userId: string) => {
      if (!chatDB) return;

      syncEntity({
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
      setUnreadTick((t) => t + 1);
    },
    [queryClient],
  );

  const resetUnread = useCallback(
    async (userId: string) => {
      if (!chatDB) return;

      syncEntity({
        db: chatDB,
        queryClient,
        store: "conversations",
        key: "user_id",
        keyValue: userId,
        queryKey: ["conversations"],
        predicate: (c: any) => c.user.id === userId || c.id === userId,
        updater: (c: any) => ({
          ...c,
          unread_count: 0,
        }),
      });
      setUnreadTick((t) => t + 1);
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
        const senderId = n.payload.sender.id;
        incrementUnread(senderId);
        syncEntity({
          db: chatDB,
          queryClient,
          store: "conversations",
          key: "id", // Assuming conversation ID or user ID
          keyValue: senderId,
          queryKey: ["conversations"],
          predicate: (c: any) => c.user?.id === senderId || c.id === senderId,
          updater: (c: any) => ({
            ...c,
            last_message: {
              body: n.body, // Use appropriate field
              created_at: n.created_at,
              updated_at: n.updated_at,
              sender_id: senderId,
              media_type: n.media_type || "text",
              media_url: n.media_url || "",
            },
            updated_at: n.updated_at,
          }),
        });
      }
    },
    [queryClient, incrementUnread],
  );

  // TOTAL UNREAD — chat and system are independent, never mixed
  const totalUnread = useMemo(() => {
    const chatUnread = conversationsData.reduce(
      (acc: number, [, data]: any) => {
        const unread =
          data?.pages?.reduce((pageAcc: number, page: any) => {
            return (
              pageAcc +
              (page?.items?.reduce(
                (sum: number, item: any) => sum + (item.unread_count || 0),
                0,
              ) || 0)
            );
          }, 0) || 0;

        return acc + unread;
      },
      0,
    );

    const systemUnread = summary?.notifications?.unread_count || 0;

    return chatUnread + systemUnread;
  }, [conversationsData, summary, unreadTick]);

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
