import { Variants } from "framer-motion";
import { onboardingTree } from "./fields";
import { Check, CheckCheck } from "lucide-react";

export const extractErrorMessage = (
  error:
    | {
        response: { data: any };
        message: string | string[];
      }
    | undefined,
) => {
  try {
    // 1. Dig into the response data (where FastAPI's detail lives)
    const resData = error?.response?.data;

    if (resData) {
      // Handle the specific structure: { detail: { message: "..." } }
      if (resData.detail?.message) {
        return resData.detail.message;
      }

      // Handle FastAPI Validation Errors: { detail: [{ loc: [...], msg: "..." }] }
      if (Array.isArray(resData.detail)) {
        return resData.detail
          .map((d: { loc: string | any[]; msg: string }) => {
            const field = Array.isArray(d.loc)
              ? d.loc[d.loc.length - 1]
              : d.loc || "";
            const formattedField = field
              .toString()
              .replace(/_/g, " ")
              .replace(/^\w/, (c: string) => c.toUpperCase());
            const cleanMsg = d.msg
              ?.replace("Field required", "is required")
              .trim();
            return formattedField ? `${formattedField} ${cleanMsg}` : cleanMsg;
          })
          .join(" | ");
      }

      // Handle simple string detail: { detail: "Error message" }
      if (typeof resData.detail === "string") {
        return resData.detail;
      }

      // Handle direct message or error keys: { message: "..." }
      if (resData.message && typeof resData.message === "string")
        return resData.message;
      if (resData.error && typeof resData.error === "string")
        return resData.error;
    }

    // 2. If no response data, check for standard Axios error messages
    if (error?.message) {
      if (error.message.includes("network error"))
        return "Network error. Please check your connection.";
      if (error.message.includes("timeout"))
        return "Request timed out. Please try again.";
      return error.message;
    }

    return "An unknown error occurred";
  } catch (err) {
    console.error("Error parsing message:", err);
    return "Something went wrong while processing the error.";
  }
};

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

export const formStepVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 },
};

// Progress bar steps
export const steps = [
  { number: 1, title: "Account Created", desc: "Welcome to our platform" },
  { number: 2, title: "Store Setup", desc: "Store details & verification" },
  { number: 3, title: "Getting Started", desc: "Branding & first products" },
  { number: 4, title: "Complete", desc: "Ready to start selling" },
];

export const storedUserEmail = (email?: string) => {
  if (email) {
    localStorage.setItem("register_email", email);
  } else {
    return localStorage.getItem("register_email");
  }
};

export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const fadeIn = (direction = "up", delay = 0): Variants => ({
  hidden: {
    opacity: 0,
    y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
    x: direction === "left" ? 40 : direction === "right" ? -40 : 0,
  },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay },
  },
});

export const statusStyles: any = {
  Processing: "bg-yellow-100 text-yellow-700",
  Ready_for_Shipment: "bg-blue-100 text-blue-700",
  Shipped: "bg-purple-100 text-purple-700",
  Completed: "bg-[#F0FDF4] text-[#38C066]",
};

export const formatCurrency = (amount: any) =>
  `₦${Number(amount || 0).toLocaleString("en-NG")}`;

export const getFirstMissingStep = (missingSections: string | string[]) => {
  for (const [step, tabs] of Object.entries(onboardingTree)) {
    for (const [tab, fields] of Object.entries(tabs)) {
      if (fields.some((f) => missingSections.includes(f))) {
        return { step: Number(step), tab };
      }
    }
  }
  return { step: 2, tab: "store" }; // default
};

export const getMessageLayout = (isSender: boolean) => ({
  container: isSender
    ? "flex flex-col gap-1 items-end ml-auto max-w-[70%]"
    : "flex flex-col gap-1 items-start max-w-[70%]",

  bubble: isSender ? "bg-orange text-white" : "bg-[#EFF3F4] text-black",

  time: isSender ? "text-white" : "text-black",
});

export const renderCheck = (status: string) => {
  if (status === "sent") return <Check size={12} />;
  if (status === "delivered") return <CheckCheck size={12} />;
  if (status === "read") return <CheckCheck size={12} className="" />;
};

export const formatMessageDate = (dateString: string) => {
  const date = new Date(dateString);

  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();

  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};
