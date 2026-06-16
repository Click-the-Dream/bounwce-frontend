import { useContext } from "react";
import { useMutation } from "@tanstack/react-query";
import { AuthContext } from "../context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { useRouter } from "next/navigation";
import { onFailure, onSuccess } from "../_utils/notification";
import { extractErrorMessage, storedUserEmail } from "../_utils/formatters";
import { deleteChatDB } from "../store/chat-store";
import { useChatUtils } from "../context/ChatContext";

const useAuthServices = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authDetails, updateAuth } = useContext(AuthContext);
  const { resetChatState } = useChatUtils();
  const client = api;

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await client.post("/auth/resend-otp", credentials);
      return data.data;
    },
    onSuccess: (data) => {
      onSuccess({
        title: "Login Successful!",
        message: `Here is your otp ${data?.otp}`,
      });
      router.push("/vendor");
    },
    onError: async (error: any, variables: any) => {
      onFailure({ title: "Login Failed", message: extractErrorMessage(error) });
      if (error?.response?.data?.message === "Email not verified") {
        await requestOtpMutation.mutateAsync(variables?.email);
        router.push("/email-verification");
      }
    },
  });

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const { data } = await client.post("/auth/register", userData);
      return data?.data;
    },
    onSuccess: (userData, variables: any) => {
      onSuccess({
        title: "Registration Successful!",
        message: `User created successfully - ${userData?.otp}`,
      });
      storedUserEmail(variables.email);
      router.push("/email_verification");
    },
    onError: async (err: any) => {
      onFailure({
        title: "Registration Failed",
        message: extractErrorMessage(err),
      });
    },
  });

  // Update Profile Mutation
  const updateProfile = useMutation({
    mutationFn: async (profileData: any) => {
      if (!authDetails?.user?.profile?.userId) {
        throw new Error("User ID not found");
      }
      const { data } = await client.put(
        `/profile/${authDetails.user.profile.userId}`,
        profileData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      if (!data?.status) {
        throw new Error(data?.message || "Error updating profile");
      }
      return data.data;
    },
    onSuccess: (updatedUser) => {
      const { user, ...other } = authDetails;
      updateAuth({ ...other, user: { ...user, ...updatedUser } });
      onSuccess({
        title: "Profile Update",
        message: "Profile updated successfully!",
      });
    },
    onError: (err: any) => {
      onFailure({
        title: "Failed to update profile",
        message: extractErrorMessage(err),
      });
    },
  });

  const requestOtpMutation = useMutation({
    mutationFn: async (credentials: { email?: string }) => {
      if (credentials?.email) storedUserEmail(credentials.email);
      const email = credentials?.email ?? storedUserEmail();
      if (!email) throw new Error("No email provided");
      const { data } = await client.post("/auth/resend-otp", { email });
      return data;
    },
    onSuccess: ({ data }) => {
      onSuccess({
        title: "OTP Requested!",
        message:"check your mail for the otp"// `Here is your otp ${data?.otp}`,
      });
    },
    onError: (err: any) => {
      onFailure({
        title: "Can't Request OTP",
        message: extractErrorMessage(err),
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (otpData: any) => {
      const email = otpData?.email ?? storedUserEmail();
      if (!email) throw new Error("No email provided");
      const { data } = await client.post("/auth/verify-code", {
        ...otpData,
        email,
      });
      return data.data;
    },
    onSuccess: (userData) => {
      updateAuth(userData);
    },
    onError: (err: any) => {
      onFailure({
        title: "OTP Verification Failed",
        message: extractErrorMessage(err),
      });
    },
  });

  // FIX (Bug 6 + Bug 7): Full logout teardown in the correct order:
  // 1. Reset in-memory chat state (prewarmedCacheRef, selectedChat, etc.)
  // 2. Wipe IndexedDB — wrapped in try/catch so a DB error never blocks logout
  // 3. Clear React Query cache via the hook instance (fixes Bug 5)
  // 4. Clear auth state
  // onError still redirects — logout must always complete
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const userId = authDetails?.user?.id;

      // Step 1: wipe in-memory chat state
      resetChatState();

      // Step 2: wipe IndexedDB — never block logout on DB failure
      try {
        if (userId) await deleteChatDB(userId);
      } catch {}

      // Step 3: clear React Query cache (hook instance — fixes Bug 5)
      queryClient.clear();

      // Step 4: clear auth (triggers safeLogout inside updateAuth)
      updateAuth(null);

      return null;
    },
    onSuccess: () => {
      onSuccess({
        title: "Logout successful",
        message: "You have been logged out.",
      });
      window.location.href = "/login";
    },
    onError: (err: any) => {
      // FIX (Bug 7): always redirect even on error so user is never stuck
      onFailure({ title: "Logout Failed", message: extractErrorMessage(err) });
      window.location.href = "/login";
    },
  });

  return {
    login: loginMutation,
    signUp: registerMutation,
    verifyOtp: verifyOtpMutation,
    requestOtp: requestOtpMutation,
    logout: logoutMutation,
    updateProfile,
    storedUserEmail,
  };
};

export default useAuthServices;
