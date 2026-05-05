import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const useInterest = () => {
  const { authDetails } = useAuth();
  const queryClient = useQueryClient();

  // =========================
  // GET: Available Interests
  // =========================
  const useGetAvailableInterests = (hasInterests: boolean) => {
    return useQuery({
      queryKey: ["interests", "available"],
      queryFn: async () => {
        const res = await api.get("/interests/available");
        return res.data.data;
      },
      enabled: !!authDetails?.access_token && !hasInterests,
    });
  };

  // =========================
  // GET: User Interests
  // =========================
  const useGetUserInterests = () => {
    return useQuery({
      queryKey: ["interests", "user"],
      queryFn: async () => {
        const res = await api.get("/interests/user");
        return res?.data?.data?.interests || [];
      },
      enabled: !!authDetails?.access_token,
    });
  };

  // =========================
  // POST: Add Interests
  // =========================
  const addUserInterests = useMutation({
    mutationFn: async (payload: { interests: string[] }) => {
      const res = await api.post("/interests/user", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interests", "user"] });
    },
  });

  // =========================
  // PUT: Update Interests
  // =========================
  const updateUserInterests = useMutation({
    mutationFn: async (payload: { interests: string[] }) => {
      const res = await api.put("/interests/user", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interests", "user"] });
    },
  });

  // =========================
  // DELETE: Remove Interest
  // =========================
  const useRemoveUserInterest = () => {
    return useMutation({
      mutationFn: async (interestId: string) => {
        const res = await api.delete("/interests/user", {
          data: { interest_id: interestId },
        });
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["interests", "user"] });
      },
    });
  };

  return {
    useGetAvailableInterests,
    useGetUserInterests,
    addUserInterests,
    updateUserInterests,
    useRemoveUserInterest,
  };
};

export default useInterest;
