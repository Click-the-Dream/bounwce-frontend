"use client";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const readRequestPageItems = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.requests)) return payload.requests;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.requests)) return payload.data.requests;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getNextRequestPage = (
  lastPage: any,
  allPages: any[],
  pageSize: number,
): number | undefined => {
  const currentPage = Number(
    lastPage?.page ??
      lastPage?.current_page ??
      lastPage?.pagination?.page ??
      lastPage?.pagination?.current_page ??
      lastPage?.meta?.page ??
      lastPage?.meta?.current_page ??
      lastPage?.data?.page ??
      lastPage?.data?.current_page ??
      lastPage?.data?.pagination?.page ??
      lastPage?.data?.meta?.current_page ??
      allPages.length,
  );

  const hasNext =
    lastPage?.has_next ??
    lastPage?.hasNext ??
    lastPage?.has_more ??
    lastPage?.pagination?.has_next ??
    lastPage?.pagination?.hasNext ??
    lastPage?.meta?.has_next ??
    lastPage?.data?.has_next ??
    lastPage?.data?.pagination?.has_next;

  if (typeof hasNext === "boolean") return hasNext ? currentPage + 1 : undefined;

  const totalPages =
    lastPage?.total_pages ??
    lastPage?.pagination?.total_pages ??
    lastPage?.meta?.total_pages ??
    lastPage?.data?.total_pages ??
    lastPage?.data?.pagination?.total_pages;
  if (typeof totalPages === "number") {
    return currentPage < totalPages ? currentPage + 1 : undefined;
  }

  const totalItems =
    lastPage?.total ??
    lastPage?.total_count ??
    lastPage?.pagination?.total ??
    lastPage?.pagination?.total_count ??
    lastPage?.meta?.total ??
    lastPage?.meta?.total_count ??
    lastPage?.data?.total ??
    lastPage?.data?.total_count ??
    lastPage?.data?.pagination?.total ??
    lastPage?.data?.pagination?.total_count;

  if (typeof totalItems === "number") {
    const loadedItems = allPages.reduce(
      (count, page) => count + readRequestPageItems(page).length,
      0,
    );
    return loadedItems < totalItems ? currentPage + 1 : undefined;
  }

  const items = readRequestPageItems(lastPage);
  return items.length >= pageSize ? currentPage + 1 : undefined;
};

const useMatch = () => {
  const { authDetails } = useAuth();
  const queryClient = useQueryClient();

  const useGetSuggestedCandidates = () => {
    return useInfiniteQuery({
      queryKey: ["matches", "suggest"],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await api.get(`/matches/suggest?page=${pageParam}`);
        return res?.data; // Return the whole object to access 'has_next'
      },
      getNextPageParam: (lastPage) => {
        return lastPage.has_next ? lastPage.page + 1 : undefined;
      },
      enabled: !!authDetails?.access_token,
      initialPageParam: 1,
    });
  };

  const useGetMatchRequests = (
    { enabled = true, pageSize = 100 }: { enabled?: boolean; pageSize?: number } = {},
  ) => {
    const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));

    return useInfiniteQuery({
      queryKey: ["matches", "requests", "received", safePageSize],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await api.get("/matches/requests", {
          params: { page: pageParam, page_size: safePageSize },
        });
        return res?.data;
      },
      enabled: !!authDetails?.access_token && enabled,
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        getNextRequestPage(lastPage, allPages, safePageSize),
      staleTime: 15_000,
    });
  };

  // GET: Outgoing match requests created by the signed-in user.
  // The endpoint is paginated, so callers can load older requests on demand.
  const useGetSentMatchRequests = (pageSize = 100, enabled = true) => {
    const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));

    return useInfiniteQuery({
      queryKey: ["matches", "requests", "sent", safePageSize],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await api.get("/matches/requests/me", {
          params: { page: pageParam, page_size: safePageSize },
        });
        return res?.data;
      },
      enabled: !!authDetails?.access_token && enabled,
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        getNextRequestPage(lastPage, allPages, safePageSize),
      staleTime: 15_000,
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
      queryClient.invalidateQueries({ queryKey: ["matches", "requests", "sent"] });
      queryClient.invalidateQueries({ queryKey: ["matches", "suggest"] });
      queryClient.invalidateQueries({
        queryKey: ["matches", "connection-status"],
      });
    },
  });

  // POST: Respond to Match Request (accept/reject)
  const respondToMatchRequest = useMutation({
    mutationFn: async (payload: {
      request_id: string;
      action: "accept" | "reject";
    }) => {
      const res = await api.post(
        `/matches/requests/${payload.request_id}/respond`,
        {
          accepted: payload.action === "accept" ? true : false,
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", "requests"] });
      queryClient.invalidateQueries({ queryKey: ["matches", "requests", "sent"] });
      queryClient.invalidateQueries({ queryKey: ["matches", "connection-status"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });

  // GET: Matches (confirmed matches)
  const useGetMatches = () => {
    return useQuery({
      queryKey: ["matches", "list"],
      queryFn: async () => {
        const res = await api.get("/matches");
        return res?.data || [];
      },
      enabled: !!authDetails?.access_token,
    });
  };
  const useGetMatchesByUserId = (user_id?: string) => {
    return useQuery({
      queryKey: ["matches", user_id],
      queryFn: async () => {
        const res = await api.get(`/matches/${user_id}`);
        return res?.data || [];
      },
      enabled: !!authDetails?.access_token && !!user_id,
    });
  };

  // GET: Connection status between the signed-in user and a profile being viewed.
  // Keep the user ID in the query key so profile navigation cannot reuse another
  // profile's relationship status from cache.
  const useGetConnectionStatus = (otherUserId?: string, enabled = true) => {
    return useQuery({
      queryKey: ["matches", "connection-status", otherUserId],
      queryFn: async () => {
        if (!otherUserId) return null;
        const res = await api.get(
          `/matches/connection-status/${encodeURIComponent(otherUserId)}`,
        );
        return res?.data ?? null;
      },
      enabled: !!authDetails?.access_token && !!otherUserId && enabled,
      staleTime: 30_000,
    });
  };

  const useBouwnceSearch = (message: string, page_size: number = 10) => {
    return useInfiniteQuery({
      queryKey: ["matches", "search", message, page_size],

      enabled: !!message,

      initialPageParam: 1,

      queryFn: async ({ pageParam = 1 }) => {
        const res = await api.get("/search/parse", {
          params: {
            message,
            domain: "buddy",
            page: pageParam,
            page_size,
          },
        });

        return res.data;
      },

      getNextPageParam: (lastPage, allPages) => {
        const hasNext = lastPage?.data?.search_results?.has_next;

        return hasNext ? allPages.length + 1 : undefined;
      },
    });
  };

  return {
    useGetSuggestedCandidates,
    useGetMatchRequests,
    useGetSentMatchRequests,
    useGetMatches,
    useBouwnceSearch,
    createMatchRequest,
    respondToMatchRequest,
    useGetMatchesByUserId,
    useGetConnectionStatus,
  };
};

export default useMatch;
