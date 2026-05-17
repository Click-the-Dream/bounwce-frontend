import { toast } from "react-toastify";
import { MdCancel, MdCheckCircle } from "react-icons/md";
import { IoInformationCircle } from "react-icons/io5";
import { motion } from "framer-motion";

interface BaseToastProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badgeBg: string;
  borderColor: string;
  title: string;
  message?: string;
}

const BaseToast = ({
  icon: Icon,
  iconColor,
  badgeBg,
  borderColor,
  title,
  message,
}: BaseToastProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96, y: -8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.96, y: -4 }}
    transition={{ duration: 0.25, ease: "easeInOut" }}
    className={`flex items-start gap-3 p-3 min-w-65 max-w-[320px] bg-white  border ${borderColor} rounded-xl shadow-xl`}
  >
    {/* Compact Icon Wrapper */}
    <div
      className={`p-1.5 rounded-lg ${badgeBg} shrink-0 grid place-items-center`}
    >
      <Icon className={`${iconColor} text-lg`} />
    </div>

    {/* Content Area */}
    <div className="flex flex-col min-w-0 pt-0.5">
      <span className="text-zinc-900 font-semibold text-xs tracking-tight truncate">
        {title}
      </span>
      {message && (
        <p className="text-zinc-500  text-[11px] mt-0.5 leading-normal wrap-break-word font-normal">
          {message}
        </p>
      )}
    </div>
  </motion.div>
);

// --- Exported Helper Functions ---

interface ToastPayload {
  title?: string;
  message?: string;
}

export const onFailure = (error?: ToastPayload) => {
  toast(
    <BaseToast
      icon={MdCancel}
      iconColor="text-red-600"
      badgeBg="bg-red-50"
      borderColor="border-red-100"
      title={error?.title || "Action Failed"}
      message={error?.message}
    />,
  );
};

export const onSuccess = (success?: ToastPayload) => {
  toast(
    <BaseToast
      icon={MdCheckCircle}
      iconColor="text-emerald-600"
      badgeBg="bg-emerald-50"
      borderColor="border-emerald-100"
      title={success?.title || "Success"}
      message={success?.message}
    />,
  );
};

export const onPrompt = (prompt?: ToastPayload) => {
  toast(
    <BaseToast
      icon={IoInformationCircle}
      iconColor="text-blue-600"
      badgeBg="bg-blue-50"
      borderColor="border-blue-100"
      title={prompt?.title || "Update"}
      message={prompt?.message}
    />,
  );
};
