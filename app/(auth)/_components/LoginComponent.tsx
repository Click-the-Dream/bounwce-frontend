"use client";
import Button from "@/app/_components/common/Button";
import Input from "@/app/_components/common/Input";
import useAuthServices from "@/app/hooks/use-authservices";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

const LoginComponents = ({
  isModal = false,
  onSuccess: handleSuccess,
}: {
  isModal?: boolean;
  onSuccess?: (data: any) => void;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const { requestOtp } = useAuthServices();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: any) => {
    // Simulate API call if needed
    requestOtp.mutate(data, {
      onSuccess: () => {
        if (isModal && handleSuccess) {
          handleSuccess(data);
        } else {
          const verificationPath = redirectTarget
            ? `/email_verification?redirect=${encodeURIComponent(redirectTarget)}`
            : "/email_verification";
          router.push(verificationPath);
        }
      },
    });
  };

  return (
    <motion.div
      className="flex flex-col gap-5 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <Input
          placeholder="Your email"
          type="email"
          icon={<Mail size={15} />}
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Please enter a valid email address",
            },
          })}
          error={errors.email?.message}
        />

        <Button
          text={requestOtp.isPending ? "Logging in..." : "Log in"}
          type="submit"
          disabled={requestOtp.isPending}
        />
      </form>
    </motion.div>
  );
};

export default LoginComponents;
