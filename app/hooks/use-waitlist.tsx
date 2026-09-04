import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../services/query-client";
import api from "../services/api";
import { onFailure, onSuccess } from "../_utils/notification";
import { extractErrorMessage } from "../_utils/formatters";

const useWaitlist = () => {
  const client = api;

  const joinWaitlistMutation = useMutation({
    mutationFn: async (credentials) => {
      const { data } = await client.post("/waitlist/waitlist", credentials);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlistUsers"] });
      onSuccess({
        title: "You're on the waitlist!",
        message: "Check your inbox for a confirmation email and updates soon.",
      });
    },
    onError: (error: any) => {
      console.log("error", error);
      onFailure({
        title: "Failed to join waitlist!",
        message: extractErrorMessage(error) || "Something went wrong",
      });
    },
  });

  const waitlistUserQuery = useQuery({
    queryKey: ["waitlistUsers"],
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data } = await client.get("/waitlist/waitlist");

      return data.data;
    },
  });

  return {
    joinWaitlist: joinWaitlistMutation,
    waitlistUser: waitlistUserQuery,
  };
};

export default useWaitlist;
