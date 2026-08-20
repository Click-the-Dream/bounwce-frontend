import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "../services/query-client";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const useNotificationServices = () => {
  const client = api;
  const { authDetails } = useAuth();

  // GET NOTIFICATIONS (INFINITE)
  const getNotifications = () =>
    useInfiniteQuery({
      queryKey: ["notifications"],
      initialPageParam: 1,

      queryFn: async ({ pageParam = 1 }) => {
        const { data } = await client.get(
          `/notifications?page=${pageParam}&page_size=20`,
        );

        return data;
      },

      getNextPageParam: (lastPage) => {
        const currentPage = lastPage.page;
        const total = lastPage.total;
        const pageSize = lastPage.page_size;
        const totalPages = Math.ceil(total / pageSize);

        return currentPage < totalPages ? currentPage + 1 : undefined;
      },

      enabled: !!authDetails?.access_token,
    });

  // MARK AS READ
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await client.patch(
        `/notifications/${notificationId}/read`,
      );

      return data;
    },

    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;

        return {
          ...old,

          pages: old.pages.map((page: any) => ({
            ...page,

            data: {
              ...page.data,

              items: (page.data?.items ?? []).filter(
                (item: any) => item.id !== notificationId,
              ),
            },
          })),
        };
      });

      queryClient.invalidateQueries({
        queryKey: ["unread-summary"],
      });
    },
  });

  // UNREAD SUMMARY
  const unreadSummary = () =>
    useQuery({
      queryKey: ["unread-summary"],

      queryFn: async () => {
        const { data } = await client.get("/events/unread");

        return data;
      },

      enabled: !!authDetails?.access_token,
    });

  // GET VAPID PUBLIC KEY
  const vapidPublicKey = () =>
    useQuery({
      queryKey: ["push-vapid-public-key"],

      queryFn: async () => {
        const { data } = await client.get("/push/vapid-public-key");

        return data?.data;
      },

      enabled: !!authDetails?.access_token,
    });

  // SUBSCRIBE CURRENT BROWSER TO WEB PUSH
  const subscribePush = useMutation({
    mutationFn: async (subscription: PushSubscriptionJSON) => {
      const { data } = await client.post("/push/subscribe", subscription);

      return data;
    },
  });

  // UNSUBSCRIBE CURRENT BROWSER FROM WEB PUSH
  const unsubscribePush = useMutation({
    mutationFn: async () => {
      const { data } = await client.delete("/push/subscribe");

      return data;
    },
  });

  // SEND TEST PUSH
  const sendTestPush = useMutation({
    mutationFn: async () => {
      const { data } = await client.post("/push/test");

      return data;
    },
  });

  return {
    // Notifications
    getNotifications,
    markAsRead,
    unreadSummary,

    // Push notifications
    vapidPublicKey,
    subscribePush,
    unsubscribePush,
    sendTestPush,
  };
};

export default useNotificationServices;
