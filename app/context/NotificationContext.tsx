"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useEffect,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import useNotificationServices from "../hooks/use-notification";
import {
  Notification,
  NotificationContextType,
} from "../_utils/types/notification";
import { syncEntity } from "../helpers/db-sync";
import { useChatUtils } from "./ChatContext";

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const queryClient = useQueryClient();
  const { chatDBRef } = useChatUtils();

  const { getNotifications, unreadSummary } = useNotificationServices();

  // 1. Reactive System Unread
  const { data: summary } = unreadSummary();
  const systemUnread = summary?.notifications?.unread_count || 0;
  const [conversations, setConversations] = useState<any>(() =>
    queryClient.getQueryData(["conversations", {}]),
  );

  useEffect(() => {
    // Subscribe to any conversations cache key changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.query.queryKey[0] === "conversations" &&
        event.type === "updated"
      ) {
        setConversations(event.query.state.data);
      }
    });
    return unsubscribe;
  }, [queryClient]);

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

  const decrementUnread = useCallback(
    async (userId: string) => {
      const chatDB = chatDBRef.current; // ← read inside callback
      if (!chatDB) return;
      if (!chatDB) return;
      await syncEntity({
        db: chatDB,
        queryClient,
        store: "conversations",
        key: "user_id",
        keyValue: userId,
        queryKey: ["conversations"],
        selector: (old: any, updater: any) => {
          const pages = old.pages.map((page: any) => ({
            ...page,
            items: page.items?.map((c: any) =>
              c.user?.id === userId || c.user_id === userId ? updater(c) : c,
            ),
          }));
          return { ...old, pages };
        },
        updater: (c: any) => {
          if (!c) return c;
          return {
            ...c,
            unread_count: Math.max((c?.unread_count || 0) - 1, 0),
          };
        },
      });
    },
    [queryClient, chatDBRef],
  );

  const resetUnread = useCallback(
    async (userId: string) => {
      const chatDB = chatDBRef.current; // ← read inside callback
      if (!chatDB) return;
      if (!chatDB) return;
      await syncEntity({
        db: chatDB,
        queryClient,
        store: "conversations",
        key: "peer_id",
        keyValue: userId,
        queryKey: ["conversations", {}], // ← match the actual query key
        selector: (old: any, updater: any) => {
          const pages = old.pages.map((page: any) => ({
            ...page,
            items: page.items?.map((c: any) =>
              c.user?.id === userId || c.peer_id === userId ? updater(c) : c,
            ),
          }));
          return { ...old, pages };
        },
        updater: (c: any) => {
          if (!c) return c;
          return { ...c, unread_count: 0 };
        },
      });
    },
    [queryClient, chatDBRef],
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
    },
    [queryClient],
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
