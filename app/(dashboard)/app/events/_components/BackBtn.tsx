"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const BackBtn = () => {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="cursor-pointer w-max mb-6 flex items-center gap-1.5 rounded-lg border border-gray-200 border-r-4 border-r-[#00000014] bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-[9px_0px_4px_-7px_rgba(0,0,0,0.25),inset_-4px_0px_9.3px_-3px_rgba(0,0,0,0.25)] transition-all hover:bg-gray-100 hover:-translate-x-0.5"
    >
      <ArrowLeft size={14} />
      Back
    </button>
  );
};

export default BackBtn;
