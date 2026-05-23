import { useContext } from "react";
import { useMutation } from "@tanstack/react-query";
import { AuthContext } from "../context/AuthContext";
import { queryClient } from "../services/query-client";
import api from "../services/api";
import { useRouter } from "next/navigation";
import { onFailure, onSuccess } from "../_utils/notification";
import { extractErrorMessage, storedUserEmail } from "../_utils/formatters";
import { deleteChatDB, getChatDB } from "../store/chat-store";
const useAuthServices = () => {
  const router = useRouter();
  const { authDetails, updateAuth } = useContext(AuthContext);
  const db = authDetails?.user?.id ? getChatDB(authDetails.user.id) : null;
  const client = api;

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const { data } = await client.post("/auth/resend-otp", credentials);
      return data.data;
    },
    onSuccess: (data) => {
      //updateAuth(userData); // Immediately update auth state
      onSuccess({
        title: "Login Successful!",
        message: `Here is your otp ${data?.otp}`, //"Continuing to dashboard",
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
      const errorMessage = extractErrorMessage(err);
      /* const apiMessage = err?.response?.data?.message;

      // Handle "user already exists" case more gracefully
      if (apiMessage === "User with the email already exist") {
        // Step 1: Gently inform user what’s happening
        onSuccess({
          message: "Email already registered",
          success: "Sending you a new verification code...",
        });
        // Step 2: Actually request the OTP
        await requestOtpMutation.mutateAsync(variables?.email, {
          onSuccess: () => {
            // Step 3: Save the email and redirect with a short UX delay
            storedUserEmail(variables?.email);
            navigate("/email_verification", {
              state: variables,
              replace: true,
            });
          },
        });

        return;
      }*/

      // Default fallback for other errors
      onFailure({
        title: "Registration Failed",
        message: errorMessage,
      });
    },
  });

  // Mutation for updating profile
  const updateProfile = useMutation({
    mutationFn: async (profileData) => {
      if (!authDetails?.user?.profile?.userId) {
        throw new Error("User ID not found");
      }

      const { data } = await client.put(
        `/profile/${authDetails.user.profile.userId}`,
        profileData, // Profile data must be in the second argument
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (!data && data?.status) {
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
      if (credentials?.email) {
        storedUserEmail(credentials?.email);
      }
      const email = credentials?.email ?? storedUserEmail(); // Call function to get email
      if (!email) {
        throw new Error("No email provided");
      }
      const { data } = await client.post("/auth/resend-otp", { email: email });

      return data;
    },
    onSuccess: ({ data }) => {
      //setOtpRequested(true);
      onSuccess({
        title: "OTP Requested!",
        message: `Here is your otp ${data?.otp}`,
      });
    },
    onError: (err: any) => {
      // setOtpRequested(false);
      onFailure({
        title: "Can't Request OTP",
        message: extractErrorMessage(err),
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (otpData: any) => {
      const email = otpData?.email ?? storedUserEmail(); // Call function to get email
      if (!email) {
        throw new Error("No email provided");
      }
      const { data } = await client.post("/auth/verify-code", {
        ...otpData,
        email: email,
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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const userId = authDetails?.user?.id;

      if (userId) {
        await deleteChatDB(userId);
      }

      queryClient.clear();
      updateAuth(null); // Reset auth state
      return null;
    },
    onSuccess: () => {
      onSuccess({
        title: "Logout successful",
        message: "You have been logged out.",
      });
      // Force hard refresh to reset memory/state
      window.location.href = "/login";
    },
    onError: (err: any) => {
      onFailure({ title: "Logout Failed", message: extractErrorMessage(err) });
    },
  });

  return {
    login: loginMutation,
    signUp: registerMutation,
    verifyOtp: verifyOtpMutation,
    requestOtp: requestOtpMutation,
    logout: logoutMutation,
    updateProfile: updateProfile,
    storedUserEmail,
  };
};

export default useAuthServices;
