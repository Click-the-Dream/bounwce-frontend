import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../services/query-client";
import api from "../services/api";
import { onFailure, onSuccess } from "../_utils/notification";
import { extractErrorMessage } from "../_utils/formatters";
import { useAuth } from "../context/AuthContext";

const useNotificationServices = () => {
  const client = api;
  const { authDetails } = useAuth();

  // ─── Get Notifications ────────
  const getNotifications = () =>
    useQuery({
      queryKey: ["notifications"],
      queryFn: async () => {
        const { data } = await client.get("/notifications");
        return data;
      },
      enabled: !!authDetails,
    });

  // ─── Mark Notification As Read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await client.patch(
        `/notifications/${notificationId}/read`,
      );

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });

      queryClient.invalidateQueries({
        queryKey: ["unread-summary"],
      });
    },

    onError: (error: any) => {
      onFailure({
        title: "Update Failed",
        message:
          extractErrorMessage(error) || "Could not mark notification as read.",
      });
    },
  });

  // ─── Unread Summary ───────────
  const unreadSummary = () =>
    useQuery({
      queryKey: ["unread-summary"],
      queryFn: async () => {
        const { data } = await client.get("/events/unread");
        return data;
      },
      enabled: !!authDetails,
    });

  return {
    getNotifications,
    markAsRead,
    unreadSummary,
  };
};

export default useNotificationServices;
