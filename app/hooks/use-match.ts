"use client";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const useMatch = () => {
  const { authDetails } = useAuth();
  const queryClient = useQueryClient();

  const useGetSuggestedCandidates = () => {
    return useQuery({
      queryKey: ["matches", "suggest"],
      queryFn: async () => {
        const res = await api.get("/matches/suggest");
        return res?.data?.items || res?.data;
      },
      enabled: !!authDetails?.access_token,
    });
  };
  const useGetMatchRequests = () => {
    return useQuery({
      queryKey: ["matches", "requests"],
      queryFn: async () => {
        const res = await api.get("/matches/requests");
        return res?.data?.items || res?.data;
      },
      enabled: !!authDetails?.access_token,
    });
  };

  // POST: Create Match Request
  const createMatchRequest = useMutation({
    mutationFn: async (payload: {
      target_user_id: string;
      message?: string;
    }) => {
      const res = await api.post("/matches/requests", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["matches", "suggest"] });
    },
  });

  // POST: Respond to Match Request (accept/reject)
  const respondToMatchRequest = useMutation({
    mutationFn: async (payload: {
      request_id: string;
      action: "accept" | "reject";
    }) => {
      const res = await api.post(`/matches/requests/${payload.request_id}`, {
        action: payload.action,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });

  // GET: Matches (confirmed matches)
  const useGetMatches = () => {
    return useQuery({
      queryKey: ["matches", "list"],
      queryFn: async () => {
        const res = await api.get("/matches");
        return res?.data?.items || [];
      },
      enabled: !!authDetails?.access_token,
    });
  };

  const useSearchUsers = (message: string, page_size: number = 10) => {
    return useInfiniteQuery({
      queryKey: ["matches", "search", message, page_size],

      enabled: !!message,

      initialPageParam: 1,

      queryFn: async ({ pageParam = 1 }) => {
        const res = await api.get("/matches/search", {
          params: {
            message,
            page: pageParam,
            page_size,
          },
        });

        return res?.data;
      },

      getNextPageParam: (lastPage, allPages) => {
        const hasMore = lastPage?.items?.length === page_size;

        return hasMore ? allPages.length + 1 : undefined;
      },
    });
  };

  return {
    useGetSuggestedCandidates,
    useGetMatchRequests,
    useGetMatches,
    useSearchUsers,
    createMatchRequest,
    respondToMatchRequest,
  };
};

export default useMatch;
