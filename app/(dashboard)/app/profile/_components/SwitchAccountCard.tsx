"use client";

import { ChevronRight } from "lucide-react";
import userImg from "../../../../assets/buyer/user.jpg";
import { useAuth } from "../../../../context/AuthContext";
import SafeImage from "@/app/_components/SafeImage";
import { useRouter } from "next/navigation";

const SwitchAccountCard = () => {
  const { authDetails } = useAuth();
  const router = useRouter();

  const role = authDetails?.user?.role;
  const isVendor = role === "vendor";

  const handleClick = () => {
    // ONE-WAY RULE: vendor never goes back
    if (isVendor) {
      router.push("/vendor");
      return;
    }

    router.push("/vendor/setup");
  };

  return (
    <div className="max-w-sm p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm">
      <h2 className="mb-1.5 text-xs font-semibold text-[#888888] uppercase font-mono">
        Switch Account
      </h2>

      <button
        onClick={handleClick}
        className="flex items-center w-full gap-3 p-1 transition-colors group hover:bg-gray-50 rounded-xl"
      >
        <div className="w-8 h-8 relative shrink-0">
          <SafeImage
            src={authDetails?.user?.profile_pic?.url || userImg}
            alt="Profile"
            width={32}
            height={32}
            className="rounded-[10.16px] w-full h-full"
          />
        </div>

        <div className="flex flex-col grow text-left">
          <span className="text-xs font-medium text-black">
            {isVendor ? "Business Hub" : "Become a Vendor"}
          </span>
          <span className="text-xs text-[#888888]">
            {authDetails?.user?.full_name}
          </span>
        </div>

        <ChevronRight className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default SwitchAccountCard;