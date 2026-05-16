import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import api from "../services/api";
import { onFailure, onSuccess } from "../_utils/notification";
import { extractErrorMessage } from "../_utils/formatters";
import { useAuth } from "../context/AuthContext";

const useUser = () => {
  const {updateAuth, authDetails } = useAuth();
  const client = api;
  const queryClient = useQueryClient();

  const useGetCurrentUser = (
    enabled: boolean = authDetails?.user?.id !== undefined,
  ) =>
    useQuery({
      queryKey: ["currentUser"],
      queryFn: async () => {
        const res = await client.get(`/users/me`);
        return res.data;
      },
      enabled,
    });

  const useGetUserById = (userId: string) =>
    useQuery({
      queryKey: ["user", userId],
      queryFn: async () => {
        const res = await client.get(`/users/${userId}`);
        return res.data?.data;
      },
      enabled: !!userId,
      staleTime: 1000 * 60 * 5,
    });

  const useGetUsers = (params: { page_size?: number; name?: string } = {}) =>
    useInfiniteQuery({
      queryKey: ["users", params],

      queryFn: async ({ pageParam = 1 }) => {
        const res = await client.get("/users", {
          params: {
            ...params,
            page: pageParam,
          },
        });

        return res.data?.data;
      },

      getNextPageParam: (lastPage: any) => {
        const { page, total, page_size } = lastPage;

        const hasMore = page * page_size < total;

        return hasMore ? page + 1 : undefined;
      },

      initialPageParam: 1,
    });

  const useGetVendorVerification = () =>
    useQuery({
      queryKey: ["vendorVerification"],
      queryFn: async () => {
        const res = await client.get(`/users/verification/`);
        return res.data?.data;
      },
    });

  const updateCurrentUser = useMutation({
    mutationFn: async (data) => {
      const res = await client.put(`/users/me`, data);
      return res.data;
    },
    onSuccess: () => {
      onSuccess({
        title: "Profile Updated",
        message: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error: any) =>
      onFailure({
        title: "Update Failed",
        message: extractErrorMessage(error),
      }),
  });

  const deleteCurrentUser = useMutation({
    mutationFn: async () => {
      const res = await client.delete(`/users/me`);
      return res.data;
    },
    onSuccess: () =>
      onSuccess({
        title: "Account Deleted",
        message: "Your account has been permanently deleted.",
      }),
    onError: (error: any) =>
      onFailure({
        title: "Deletion Failed",
        message: extractErrorMessage(error),
      }),
  });

  const updateUserById = useMutation({
    mutationFn: async ({ userId, data }: any) => {
      const res = await client.put(`/users/${userId}`, data);
      return res.data;
    },
    onSuccess: (_, { userId }) => {
      onSuccess({
        title: "User Updated",
        message: "User information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
    onError: (error: any) =>
      onFailure({
        title: "Update Failed",
        message: extractErrorMessage(error),
      }),
  });

  const deleteUserById = useMutation({
    mutationFn: async (userId) => {
      const res = await client.delete(`/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      onSuccess({
        title: "User Deleted",
        message: "User has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) =>
      onFailure({
        title: "Deletion Failed",
        message: extractErrorMessage(error),
      }),
  });

  const deactivateUser = useMutation({
    mutationFn: async () => {
      const res = await client.put(`/users/me/deactivate`);
      return res.data;
    },
    onSuccess: () => {
      onSuccess({
        title: "Account Deactivated",
        message: "Your account has been deactivated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error: any) =>
      onFailure({
        title: "Deactivation Failed",
        message: extractErrorMessage(error),
      }),
  });

  const activateUser = useMutation({
    mutationFn: async () => {
      const res = await client.put(`/users/me/activate`);
      return res.data;
    },
    onSuccess: () => {
      onSuccess({
        title: "Account Activated",
        message: "Your account has been reactivated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error: any) =>
      onFailure({
        title: "Activation Failed",
        message: extractErrorMessage(error),
      }),
  });

  const undeleteUser = useMutation({
    mutationFn: async (userId) => {
      const res = await client.post(`/users/undelete/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      onSuccess({
        title: "User Restored",
        message: "User has been restored successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) =>
      onFailure({
        title: "Restoration Failed",
        message: extractErrorMessage(error),
      }),
  });

  const updateVendorVerification = useMutation({
    mutationFn: async (data: any) => {
      const res = await client.put(`/users/verification/`, data);
      return res.data;
    },
    onSuccess: () => {
      onSuccess({
        title: "Verification Updated",
        message: "Vendor verification details have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["vendorVerification"] });
    },
    onError: (error: any) =>
      onFailure({
        title: "Update Failed",
        message: extractErrorMessage(error),
      }),
  });

  const createVendorVerification = useMutation({
    mutationFn: async (data: any) => {
      const res = await client.post(`/users/verification/`, data);
      return res.data;
    },
    onSuccess: () => {
      onSuccess({
        title: "Verification Submitted",
        message: "Your verification request has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["vendorVerification"] });
    },
    onError: (error: any) =>
      onFailure({
        title: "Submission Failed",
        message: extractErrorMessage(error),
      }),
  });

const uploadProfilePicture = useMutation({
  mutationFn: async (file: File) => {
    const formData = new FormData();
    formData.append("picture", file);

    const res = await client.put(
      "/users/profile-picture",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res.data;
  },

  onSuccess: (response: any) => {
    const updatedUser = response?.data;

    // Update auth context immediately
    updateAuth((prev: any) => ({
      ...prev,
      user: updatedUser,
    }));

    // Update query cache
    queryClient.setQueryData(["currentUser"], response);

    onSuccess({
      title: "Profile Updated",
      message: "Your profile has been updated successfully.",
    });
  },

  onError: (error: any) =>
    onFailure({
      title: "Upload Failed",
      message: extractErrorMessage(error),
    }),
});

const deleteProfilePicture = useMutation({
  mutationFn: async () => {
    const res = await client.delete("/users/profile-picture");
    return res.data;
  },

  onSuccess: () => {
    onSuccess({
      title: "Profile Picture Removed",
      message: "Your profile picture has been deleted.",
    });

    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  },

  onError: (error: any) =>
    onFailure({
      title: "Delete Failed",
      message: extractErrorMessage(error),
    }),
});

  return {
    useGetCurrentUser,
    updateCurrentUser,
    deleteCurrentUser,
    useGetUserById,
    updateUserById,
    deleteUserById,
    useGetUsers,
    deactivateUser,
    activateUser,
    undeleteUser,
    useGetVendorVerification,
    updateVendorVerification,
    createVendorVerification,
uploadProfilePicture,
  deleteProfilePicture,
  };
};

export default useUser;
