import { useContext } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { extractErrorMessage } from "../_utils/formatters";
import { onFailure, onSuccess } from "../_utils/notification";

const useStore = () => {
  const { authDetails } = useContext(AuthContext);
  const client = api;
  const queryClient = useQueryClient();

  const handleFailure = (
    action: string,
    error: { response: { data: any }; message: string | string[] } | undefined,
  ) => {
    const message = extractErrorMessage(error);
    onFailure({ title: `${action} Failed`, message });
  };

  const handleSuccess = (action: string, message: string) => {
    onSuccess({ title: `${action} Successful`, message });
  };

  // STORE INFORMATION

  const useGetStoreInfo = (vendorId: any) =>
    useQuery({
      queryKey: ["store", vendorId],
      queryFn: async () => {
        const response = await client.get(`/store/${vendorId}`);
        return response.data.data;
      },
      enabled: !!vendorId,
    });

  const useGetMyStore = () =>
    useQuery({
      queryKey: ["store", "my-store"],
      queryFn: async () => {
        const response = await client.get("/store/my-store");
        return response.data.data;
      },
      enabled: !!authDetails?.access_token,
    });

  // STORE MUTATIONS

  const createStore = useMutation({
    mutationFn: async (storeData: any) => {
      const response = await client.post("/store/", storeData);
      return response.data.data;
    },
    onSuccess: (data) => {
      handleSuccess(
        "Store Creation",
        "Your store has been created successfully!",
      );
      queryClient.setQueryData(["store", data.id], data);
      queryClient.setQueryData(["store", "my-store"], data);
    },
    onError: (
      error:
        | { response: { data: any }; message: string | string[] }
        | undefined,
    ) => handleFailure("Store Creation", error),
  });

  const updateStore = useMutation({
    mutationFn: async (storeData: any) => {
      const response = await client.put("/store/", storeData);
      return response.data.data;
    },
    onSuccess: () => {
      handleSuccess("Store Update", "Store updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
    },
    onError: (
      error:
        | { response: { data: any }; message: string | string[] }
        | undefined,
    ) => handleFailure("Store Update", error),
  });

  const deleteStore = useMutation({
    mutationFn: async () => {
      await client.delete("/store/");
    },
    onSuccess: () => {
      handleSuccess("Store Deletion", "Store deleted successfully!");
      queryClient.removeQueries({ queryKey: ["store"] });
    },
    onError: (
      error:
        | { response: { data: any }; message: string | string[] }
        | undefined,
    ) => handleFailure("Store Deletion", error),
  });

  // STORE BRANDING
  const updateBranding = useMutation({
    mutationFn: async (brandingData) => {
      const response = await client.put("/store/branding", brandingData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.data;
    },
    onSuccess: () => {
      handleSuccess("Branding Update", "Store branding updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
    },
    onError: (
      error:
        | { response: { data: any }; message: string | string[] }
        | undefined,
    ) => handleFailure("Branding Update", error),
  });

  const deleteBrandImage = useMutation({
    mutationFn: async () => {
      const response = await client.delete("/store/brand-image");
      return response.data.data;
    },
    onSuccess: (data) => {
      handleSuccess(
        "Brand Image Deletion",
        "Brand image deleted successfully!",
      );
      queryClient.setQueryData(["store", data.id], data);
      queryClient.setQueryData(["store", "my-store"], data);
    },
    onError: (
      error:
        | { response: { data: any }; message: string | string[] }
        | undefined,
    ) => handleFailure("Brand Image Deletion", error),
  });

  // STORE ACTIVATION

  const activateStore = useMutation({
    mutationFn: async () => {
      const response = await client.put("/store/activate");
      return response.data.data;
    },
    onSuccess: (data) => {
      handleSuccess("Store Activation", "Store activated successfully!");
      queryClient.setQueryData(["store", "my-store"], data);
    },
    onError: (
      error:
        | { response: { data: any }; message: string | string[] }
        | undefined,
    ) => handleFailure("Store Activation", error),
  });

  const deactivateStore = useMutation({
    mutationFn: async () => {
      const response = await client.put("/store/deactivate");
      return response.data.data;
    },
    onSuccess: (data) => {
      handleSuccess("Store Deactivation", "Store deactivated successfully!");
      queryClient.setQueryData(["store", data.id], data);
      queryClient.setQueryData(["store", "my-store"], data);
    },
    onError: (
      error:
        | { response: { data: any }; message: string | string[] }
        | undefined,
    ) => handleFailure("Store Deactivation", error),
  });

  // STORE CONTACT INFORMATION

  const useGetStoreContact = (userId: any) =>
    useQuery({
      queryKey: ["store", "contact", userId],
      queryFn: async () => {
        const response = await client.get(`/store/contact/${userId}`);
        return response.data.data;
      },
      enabled: !!userId && !!authDetails?.access_token,
    });

  const createContact = useMutation({
    mutationFn: async (contactData: any) => {
      const response = await client.post("/store/contact/", contactData);
      return response.data.data;
    },
    onSuccess: (data) => {
      handleSuccess("Contact Creation", "Contact created successfully!");
      queryClient.setQueryData(["store", "contact", data.user_id], data);
    },
    onError: (
      error:
        | { response: { data: any }; message: string | string[] }
        | undefined,
    ) => handleFailure("Contact Creation", error),
  });

  const updateContact = useMutation({
    mutationFn: async (contactData: any) => {
      const response = await client.put("/store/contact/", contactData);
      return response.data.data;
    },
    onSuccess: (data) => {
      handleSuccess("Contact Update", "Contact updated successfully!");
      queryClient.setQueryData(["store", "contact_info", data.user_id], data);
    },
    onError: (
      error:
        | { response: { data: any }; message: string | string[] }
        | undefined,
    ) => handleFailure("Contact Update", error),
  });

  const deleteContact = useMutation({
    mutationFn: async (userId) => {
      await client.delete("/store/contact/", { data: { user_id: userId } });
    },
    onSuccess: (_, userId) => {
      handleSuccess("Contact Deletion", "Contact deleted successfully!");
      queryClient.removeQueries({ queryKey: ["store", "contact", userId] });
    },
    onError: (
      error:
        | { response: { data: any }; message: string | string[] }
        | undefined,
    ) => handleFailure("Contact Deletion", error),
  });

  const useGetPayoutInfo = (userId: any) =>
    useQuery({
      queryKey: ["store", "payout", userId],
      queryFn: async () => {
        const response = await client.get(`/store/payout/${userId}`);
        return response.data.data;
      },
      enabled: !!userId && !!authDetails?.access_token,
    });

  const createPayout = useMutation({
    mutationFn: async (payoutData: any) => {
      const response = await client.post("/store/payout/", payoutData);
      return response.data.data;
    },
    onSuccess: () => {
      handleSuccess(
        "Payout Creation",
        "Payout information added successfully!",
      );
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
    },
    onError: (
      error:
        | { response: { data: any }; message: string | string[] }
        | undefined,
    ) => handleFailure("Payout Creation", error),
  });

  const updatePayout = useMutation({
    mutationFn: async (payoutData: any) => {
      const response = await client.put("/store/payout/", payoutData);
      return response.data.data;
    },
    onSuccess: (data) => {
      handleSuccess(
        "Payout Update",
        "Payout information updated successfully!",
      );
      queryClient.setQueryData(["store", "payout", data.user_id], data);
    },
    onError: (
      error:
        | { response: { data: any }; message: string | string[] }
        | undefined,
    ) => handleFailure("Payout Update", error),
  });

  const deletePayout = useMutation({
    mutationFn: async (userId) => {
      await client.delete("/store/payout/", { data: { user_id: userId } });
    },
    onSuccess: (_, userId) => {
      handleSuccess(
        "Payout Deletion",
        "Payout information deleted successfully!",
      );
      queryClient.removeQueries({ queryKey: ["store", "payout", userId] });
    },
    onError: (
      error:
        | { response: { data: any }; message: string | string[] }
        | undefined,
    ) => handleFailure("Payout Deletion", error),
  });

  const useGetStoreOnboardingStatus = (id: any) =>
    useQuery({
      queryKey: ["store", "onboarding-status"],
      queryFn: async () => {
        const response = await client.get("/store/onboarding-status");
        return response?.data?.data;
      },
      enabled:
        !!authDetails?.access_token && authDetails?.user?.role === "vendor",
    });

  const useGetStores = (searchParams: { name: string; page_size: number }) =>
    useInfiniteQuery({
      queryKey: ["stores", searchParams],

      queryFn: async ({ pageParam = 1 }) => {
        const response = await client.get("/store", {
          params: {
            ...searchParams,
            page: pageParam,
          },
        });

        return response.data.data;
      },

      getNextPageParam: (lastPage: any) => {
        const currentPage = lastPage.page;
        const total = lastPage.total;
        const pageSize = lastPage.page_size;

        const hasMore = currentPage * pageSize < total;

        return hasMore ? currentPage + 1 : undefined;
      },

      initialPageParam: 1,
    });

  return {
    useGetStoreInfo,
    useGetMyStore,
    createStore,
    updateStore,
    deleteStore,
    updateBranding,
    deleteBrandImage,
    activateStore,
    deactivateStore,
    useGetStoreContact,
    createContact,
    updateContact,
    deleteContact,
    useGetPayoutInfo,
    createPayout,
    updatePayout,
    deletePayout,
    useGetStoreOnboardingStatus,
    useGetStores,
  };
};

export default useStore;
