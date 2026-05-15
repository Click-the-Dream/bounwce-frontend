import { ChevronRight } from "lucide-react"; // Optional: using lucide for the icon
import Image from "next/image";
import userImg from "../../../../assets/buyer/user.jpg";

const SwitchAccountCard = () => {
  return (
    <div className="max-w-sm p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm">
      {/* Header Label */}
      <h2 className="mb-1.5 text-xs font-semibold text-[#888888] uppercase font-mono">
        Switch Account
      </h2>

      {/* Account Button/Link */}
      <button className="flex items-center w-full gap-3 p-1 transition-colors group hover:bg-gray-50 rounded-xl">
        {/* Avatar */}
        <div className="w-8 h-8 relative shrink-0">
          <Image
            src={userImg}
            alt="Profile"
            width={32}
            height={32}
            className="rounded-[10.16px] w-full h-full"
            style={{
              boxShadow:
                "0px 0px 2.03px 0.51px #00000040, 0.51px -3.05px 2.03px 1.52px #00000040 inset",
            }}
          />
        </div>

        {/* Text Content */}
        <div className="flex flex-col grow text-left">
          <span className="text-xs font-medium text-black">
            Become a Vendor
          </span>
          <span className="text-xs text-[#888888]">Victor Ogunyemi</span>
        </div>

        {/* Arrow Icon */}
        <ChevronRight className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default SwitchAccountCard;
