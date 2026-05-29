import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "../services/query-client";
import api from "../services/api";
import { onFailure } from "../_utils/notification";
import { extractErrorMessage } from "../_utils/formatters";
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

      queryClient.invalidateQueries({ queryKey: ["unread-summary"] });
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

  return {
    getNotifications,
    markAsRead,
    unreadSummary,
  };
};

export default useNotificationServices;
