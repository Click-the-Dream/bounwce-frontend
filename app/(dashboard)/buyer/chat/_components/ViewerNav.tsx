import { FiZoomIn, FiDownload, FiX } from "react-icons/fi";
import SafeImage from "@/app/_components/SafeImage";
const ViewerNav = ({ user, display, handleClose }: any) => {
  return (
    <div className="h-16 w-full flex items-center justify-between px-6 border-b border-[#0000001a]">
      <div className="flex items-center gap-3">
        <div className="relative">
          {user?.type === "initials" ? (
            <div className="w-9.25 h-9.25 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-black text-xs">
              {user?.initials}
            </div>
          ) : (
            <div className="relative">
              <SafeImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}${user?.id}`}
                alt="Profile"
                width={37}
                height={37}
                className="w-9.25 h-9.25 rounded-[10px] object-cover"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22C55E] border-2 border-white rounded-full"></div>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-sm text-black leading-tight">
            {user?.name}
          </span>
          <span className="text-[13px] text-black">Today at 13:59</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-5 text-black">
        <button className="cursor-pointer">
          <FiZoomIn size={14} />
        </button>

        <a href={display.src} download className="cursor-pointer">
          <FiDownload size={14} />
        </a>

        <button onClick={handleClose} className="cursor-pointer">
          <FiX size={14} />
        </button>
      </div>
    </div>
  );
};

export default ViewerNav;
