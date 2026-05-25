import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../services/query-client";
import api from "../services/api";
import { onFailure, onSuccess } from "../_utils/notification";
import { extractErrorMessage } from "../_utils/formatters";

const useAdmin = () => {
  const client = api;

  const broadcastMessage = useMutation({
    mutationFn: async (payload: { user_ids: string[]; body: string }) => {
      const { data } = await client.post("/admin/bouwnce/messages", payload);
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
