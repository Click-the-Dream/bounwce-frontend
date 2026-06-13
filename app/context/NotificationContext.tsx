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
import { MODAL_CLOSED, ModalState } from "../_utils/types/connection";

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const queryClient = useQueryClient();
  const { getNotifications, unreadSummary } = useNotificationServices();

  const [connectionModal, setConnectionModal] =
    useState<ModalState>(MODAL_CLOSED);

  // Reactive System Unread
  const { data: summary } = unreadSummary();
  const systemUnread = summary?.notifications?.unread_count || 0;

  // Track conversation state directly from cache
  const [conversations, setConversations] = useState<any>(() =>
    queryClient.getQueryData(["conversations"]),
  );

  useEffect(() => {
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

  // Reactive Notifications
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
    (userId: string) => {
      queryClient.setQueriesData(
        { queryKey: ["conversations"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items?.map((c: any) =>
                c.user?.id === userId || c.user_id === userId
                  ? {
                      ...c,
                      unread_count: Math.max((c?.unread_count || 0) - 1, 0),
                    }
                  : c,
              ),
            })),
          };
        },
      );
    },
    [queryClient],
  );

  const resetUnread = useCallback(
    (userId: string) => {
      queryClient.setQueriesData(
        { queryKey: ["conversations"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items?.map((c: any) =>
                c.user?.id === userId || c.peer_id === userId
                  ? { ...c, unread_count: 0 }
                  : c,
              ),
            })),
          };
        },
      );
    },
    [queryClient],
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
        connectionModal,
        setConnectionModal,
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
