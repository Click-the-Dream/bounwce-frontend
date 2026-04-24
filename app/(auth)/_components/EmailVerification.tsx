"use client";
/* eslint-disable no-unused-vars */
import { motion, Variants } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { MdOutlineMail } from "react-icons/md";
import { CiKeyboard } from "react-icons/ci";
import { useRouter } from "next/navigation";
import useAuthServices from "@/app/hooks/use-authservices";
import { storedUserEmail } from "@/app/_utils/formatters";
import { onSuccess } from "@/app/_utils/notification";
import Input from "@/app/_components/common/Input";
import Button from "@/app/_components/common/Button";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const VerifyAccount = ({
  isModal,
  onFinalSuccess,
  email,
}: {
  isModal?: boolean;
  onFinalSuccess?: () => void;
  email?: string;
}) => {
  const router = useRouter();
  const { verifyOtp, requestOtp } = useAuthServices();

  const [userEmail, setUserEmail] = useState<string | undefined>(email);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const otpRef = useRef<any>(null);

  useEffect(() => {
    if (!email) {
      const savedEmail = storedUserEmail(); // safe, runs on client
      setUserEmail(savedEmail || undefined);
    }
  }, [email]);

  // Prevent reloads or accidental exits while timer is running
  useEffect(() => {
    const handleBeforeUnload = (e: {
      preventDefault: () => void;
      returnValue: string;
    }) => {
      if (timer > 0) {
        e.preventDefault();
        e.returnValue =
          "You can’t leave this page while the verification timer is running.";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [timer]);

  //Autofocus OTP field
  useEffect(() => {
    if (userEmail && otpRef.current) otpRef.current.focus();
  }, [userEmail]);

  // Start countdown once
  useEffect(() => {
    if (!userEmail) return;
    if (timer === 0) setTimer(30);
  }, [userEmail]);

  // Decrease timer every second
  useEffect(() => {
    if (timer <= 0) return;
    const countdown = setTimeout(() => setTimer((prev) => prev - 1), 1000);
    return () => clearTimeout(countdown);
  }, [timer]);

  const handleVerify = async () => {
    if (!otp) return;
    setIsLoading(true);
    try {
      await verifyOtp.mutateAsync(
        { email: userEmail, code: otp },
        {
          onSuccess: (userData) => {
            const user = userData?.user;

            // Define dynamic messages
            let successMessage = "Your account has been verified.";
            if (user?.role === "vendor" && user?.is_store_owner === false) {
              successMessage = "Verified! Let's set up your store.";
            } else if (isModal) {
              successMessage = "Verification successful!";
            }

            // Trigger the notification here
            onSuccess({
              title: "OTP Verified!",
              message: successMessage,
            });

            // Handle Redirection Logic
            if (isModal) {
              if (user?.role === "vendor") {
                const path =
                  user?.is_store_owner === false ? "/vendor/setup" : "/vendor";
                router.replace(path);
              } else {
                if (onFinalSuccess) onFinalSuccess();
              }
              return;
            }

            if (user?.role === "admin") {
              router.replace("/admin/newsletter");
            } else if (user?.role === "vendor") {
              const path =
                user?.is_store_owner === false ? "/vendor/setup" : "/vendor";
              router.replace(path);
            } else {
              router.replace("/buyer");
            }
          },
        },
      );
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!userEmail) return;
    try {
      await requestOtp.mutateAsync(
        { email: userEmail },
        {
          onSuccess: () => {
            setTimer(30);
            setOtp("");
          },
        },
      );
    } catch (err) {
      console.error("Failed to resend OTP:", err);
    }
  };

  if (!userEmail) {
    return (
      <motion.div
        className="h-screen flex items-center justify-center text-center text-gray-600"
        initial="hidden"
        animate="show"
        variants={fadeInUp}
      >
        <p>No email found. Please sign up or log in again.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full flex flex-col justify-center items-center mx-auto gap-3 flex-1 px-4 py-8"
      style={{ height: isModal ? "auto" : "100vh" }}
      initial="hidden"
      animate="show"
      variants={fadeInUp}
    >
      <motion.h1
        className="text-orange text-[clamp(20px,2vw,28px)] font-semibold mb-3"
        variants={fadeInUp}
      >
        Verify Account
      </motion.h1>

      <motion.p
        className="text-[clamp(10px,1vw,12px)] -mt-3.75 mb-3.75"
        variants={fadeInUp}
      >
        Enter the OTP sent to your email
      </motion.p>

      <motion.div className="space-y-5 w-full max-w-92" variants={fadeInUp}>
        <Input
          type="email"
          value={userEmail}
          placeholder="Enter your email"
          disabled
          icon={<MdOutlineMail size={18} className="text-gray-400" />}
        />

        <Input
          ref={otpRef}
          placeholder="6 digit OTP code"
          type="text"
          inputMode="numeric"
          icon={<CiKeyboard size={18} className="text-gray-400" />}
          value={otp}
          onChange={(e: { target: { value: any } }) => {
            const value = e.target.value;
            if (/^\d*$/.test(value) && value.length <= 6) {
              setOtp(value);
            }
          }}
        />
      </motion.div>

      <motion.div
        className="w-full max-w-92 mt-5 space-y-3"
        variants={fadeInUp}
      >
        <Button
          text={isLoading ? "Verifying..." : "Continue"}
          disabled={isLoading || !otp}
          onClick={handleVerify}
        />

        <div className="text-center text-sm text-gray-500">
          {timer > 0 ? (
            <p>
              Didn’t receive code?{" "}
              <span className="text-orange font-medium">
                Resend in {timer}s
              </span>
            </p>
          ) : (
            <button
              onClick={handleResendOtp}
              disabled={requestOtp.isPending}
              className="text-orange font-semibold hover:underline disabled:opacity-50"
            >
              {requestOtp.isPending ? "Resending..." : "Resend OTP"}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VerifyAccount;
