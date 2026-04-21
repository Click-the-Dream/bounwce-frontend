import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { onFailure, onSuccess } from "../_utils/notification";
import { extractErrorMessage } from "../_utils/formatters";

export interface NewsletterPayload {
  subject: string;
  content: string;
  name?: string; 
  description?: string;
}

export const useNewsletter = () => {
  const queryClient = useQueryClient();

  // --- QUERIES ---

  const getNewsletters = (page: number = 1, pageSize: number = 10) =>
    useQuery({
      queryKey: ["newsletters", page, pageSize],
      queryFn: async () => {
        const { data } = await api.get(`/newsletters?page=${page}&page_size=${pageSize}`);  
        return data?.data; 
      },
    });

  const getNewsletterById = (id: string) =>
    useQuery({
      queryKey: ["newsletter", id],
      queryFn: async () => {
        const { data } = await api.get(`/newsletters/${id}/`); 
        return data?.data;
      },
      enabled: !!id,
    });

  // --- MUTATIONS ---

  const createNewsletter = useMutation({
    mutationFn: async (payload: NewsletterPayload) => {
      const { data } = await api.post("/newsletters/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletters"] });
      onSuccess({ title: "Success", message: "Newsletter created successfully!" });
    },
    onError: (error: any) => {
      onFailure({ title: "Failed to create", message: extractErrorMessage(error) });
    },
  });

  const updateNewsletter = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: NewsletterPayload }) => {
      const { data } = await api.put(`/newsletters/${id}/`, payload); 
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["newsletters"] });
      queryClient.invalidateQueries({ queryKey: ["newsletter", variables.id] });
      onSuccess({ title: "Success", message: "Newsletter updated successfully!" });
    },
    onError: (error: any) => {
      onFailure({ title: "Failed to update", message: extractErrorMessage(error) });
    },
  });

  const deleteNewsletter = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/newsletters/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletters"] });
      onSuccess({ title: "Deleted", message: "Newsletter removed." });
    },
    onError: (error: any) => {
      onFailure({ title: "Failed to delete", message: extractErrorMessage(error) });
    },
  });

  const broadcastNewsletter = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/newsletters/${id}/broadcast/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletters"] });
      onSuccess({ title: "Broadcast Initiated", message: "Your newsletter is sending!" });
    },
    onError: (error: any) => {
      onFailure({ title: "Broadcast Failed", message: extractErrorMessage(error) });
    },
  });

  return {
    getNewsletters,
    getNewsletterById,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
    broadcastNewsletter,
  };
};

export default useNewsletter;