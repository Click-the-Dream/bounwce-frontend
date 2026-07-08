import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useQuery } from "@tanstack/react-query";

const useEvents = () => {
  const { authDetails } = useAuth();

  const useGetMobileEvents = (
    lastId: string = "0-0",
    blockMs: number = 25000,
    count: number = 50,
  ) => {
    return useQuery({
      queryKey: ["mobile-events", lastId],
      queryFn: async () => {
        const res = await api.get("/events/mobile", {
          params: {
            last_id: lastId,
            block_ms: blockMs,
            count,
          },
        });

        return res.data;
      },
      enabled: !!authDetails?.access_token,
      refetchOnWindowFocus: false,
      retry: false,
    });
  };

  const useGetPaymentProgress = () => {
    return useQuery({
      queryKey: ["payment-progress"],
      queryFn: async () => {
        const res = await api.get("/events/payments/progress");
        return res.data;
      },
      enabled: !!authDetails?.access_token,
      refetchInterval: 5000,
    });
  };

  const useGetUnreadSummary = () => {
    return useQuery({
      queryKey: ["unread-summary"],
      queryFn: async () => {
        const res = await api.get("/events/unread");
        return res.data;
      },
      enabled: !!authDetails?.access_token,
      refetchInterval: 10000,
    });
  };

  return {
    useGetMobileEvents,
    useGetPaymentProgress,
    useGetUnreadSummary,
  };
};

export default useEvents;
