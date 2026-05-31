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
import { User } from "../_utils/types/buyer";
import { useChatUtils } from "../context/ChatContext";

const useUser = () => {
  const { updateUser, authDetails } = useAuth();
  const { chatDBRef } = useChatUtils();
  const db = chatDBRef.current;

  const client = api;
  const queryClient = useQueryClient();

  const useGetCurrentUser = (
    enabled: boolean = authDetails?.user?.id !== undefined,
  ) =>
    useQuery({
      queryKey: ["currentUser"],
      queryFn: async () => {
        const userId = authDetails?.user?.id;
        if (db && userId) {
          const cachedUser = await db.users.get(userId);
          if (cachedUser) return cachedUser;
        }

        const res = await client.get(`/users/me`);
        const user = res.data?.data || res.data;
        if (db && user) {
          await db.users.put(user);
        }

        if (!user) throw new Error("User not found");
        return user;
      },
      enabled,
    });

  const useGetUserById = (userId: string) =>
    useQuery<User>({
      queryKey: ["user", userId],
      queryFn: async () => {
        if (db) {
          const cachedUser = await db.users.get(userId);
          if (cachedUser) return cachedUser;
        }

        const res = await client.get(`/users/${userId}`);
        const user = res.data?.data;

        if (db && user) {
          await db.users.put(user);
        }

        if (!user) throw new Error("User not found");
        return user;
      },
      enabled: !!userId,
      staleTime: 1000 * 60 * 5,
    });

  const useGetUsers = (params: { page_size?: number; name?: string } = {}) =>
    useInfiniteQuery({
      queryKey: ["users", params],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await client.get("/users", {
          params: { ...params, page: pageParam },
        });

        const data = res.data?.data;
        const items = data?.items;

        // Populate DB whenever we fetch a list
        if (db && items && Array.isArray(items)) {
          await db.users.bulkPut(items);
        }

        return data;
      },
      getNextPageParam: (lastPage: any) => {
        const { page, total, page_size } = lastPage;
        return page * page_size < total ? page + 1 : undefined;
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
    mutationFn: async (data: any) => {
      const res = await client.put(`/users/me`, data);
      return res.data.data;
    },

    onSuccess: async (updatedUser) => {
      const userId = authDetails?.user?.id;
      if (db) {
        await db.users.update(userId, updatedUser);
      }
      onSuccess({
        title: "Profile Updated",
        message: "Your profile has been updated successfully.",
      });

      queryClient.setQueryData(["currentUser"], (old: any) => {
        if (!old) return { data: updatedUser };

        return {
          ...old,
          data: updatedUser,
        };
      });

      // 2. optional: update auth if needed
      updateUser(updatedUser);
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
    onSuccess: async (data, { userId }) => {
      if (db) {
        await db.users.update(userId, data);
      }
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
    mutationFn: async ({
      file,
      fieldName = "picture",
    }: {
      file: File;
      fieldName: string;
    }) => {
      const formData = new FormData();
      formData.append(fieldName, file); // Dynamic field name

      const res = await client.put("/users/profile-picture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return res.data?.data;
    },

    onSuccess: async (updatedUser) => {
      const userId = authDetails?.user?.id;
      if (db) {
        await db.users.update(userId, updatedUser);
      }

      updateUser(updatedUser);
      queryClient.setQueryData(["currentUser"], (old: any) => {
        if (!old) return { data: updatedUser };

        return {
          ...old,
          data: updatedUser,
        };
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
