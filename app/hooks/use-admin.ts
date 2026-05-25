import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../services/query-client";
import api from "../services/api";
import { onFailure, onSuccess } from "../_utils/notification";
import { extractErrorMessage } from "../_utils/formatters";

const useAdmin = () => {
  const client = api;

  const broadcastMessage = useMutation({
    mutationFn: async ({
      all_users = false,
      user_ids,
      body,
    }: {
      all_users: boolean;
      user_ids: string[] | null;
      body: string;
    }) => {
      const { data } = await client.post(
        `/admin/bouwnce/messages?all_users=${all_users}`,
        {
          user_ids,
          body,
        },
      );
      return data;
    },
    onSuccess: () => {
      onSuccess({
        title: "Broadcast Sent",
        message: "Your message has been delivered to the selected users' DMs.",
      });
    },
    onError: (error: any) => {
      onFailure({
        title: "Broadcast Failed",
        message:
          extractErrorMessage(error) || "Could not send direct messages.",
      });
    },
  });

  return {
    broadcastMessage,
  };
};

export default useAdmin;
