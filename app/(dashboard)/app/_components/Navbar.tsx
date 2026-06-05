import { Bell, Menu, MessageCircleMore } from "lucide-react";
import userImg from "../../../assets/buyer/user.jpg";
import SearchComponent from "./SearchComponent";
import Link from "next/link";
import { useMarketStore } from "@/app/context/StoreContext";
import { useNotifications } from "@/app/context/NotificationContext";
import { useAuth } from "@/app/context/AuthContext";
import SafeImage from "@/app/_components/SafeImage";
import { useEffect, useRef, useState } from "react";
import { NotificationPanel } from "@/app/_components/NotificationPanel";
import { Portal } from "@/app/protocols/Portal";
import UserImage from "./UserImage";

const Navbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { carts } = useMarketStore();
  const { totalUnread, notifications } = useNotifications();
  const { authDetails } = useAuth();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="h-13.75 flex items-center justify-between py-2.25 px-4 md:px-6 lg:px-8 bg-white border-b border-[#00000033] sticky top-0"
      style={{
        zIndex: "50",
      }}
    >
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3 w-full">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <Menu className="size-5" />
        </button>

        {/* Search */}

        <SearchComponent />
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3 text-black ml-4 md:mr-4">
        {/* <Link href="/marketplace/carts" className="mr-0 md:mr-2">
          <div className="relative flex items-center justify-center size-9 bg-[#ECECF0] rounded-xl cursor-pointer hover:bg-gray-200 transition-colors">
            <ShoppingCart strokeWidth={1.5} className="size-5" />
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4.5 h-4.5 bg-orange text-white text-[9px] rounded-full px-1">
              {carts?.length || 0}
            </span>
          </div>
        </Link> */}
        <Link href="/app/chat" className="relative">
          <MessageCircleMore className="shrink-0 size-5 cursor-pointer" />
          {totalUnread > 0 && (
            <span className="absolute -top-2 -right-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">
              {totalUnread}
            </span>
          )}
        </Link>

        <div
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="relative cursor-pointer"
        >
          <Bell strokeWidth={1.5} className="size-5 cursor-pointer" />
          {notifications.filter((n) => !n.read_at).length > 0 && (
            <span className="absolute -top-2 -right-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">
              {notifications.filter((n) => !n.read_at).length}
            </span>
          )}
        </div>

        <Link href="/app/profile" className="w-8 h-8">
          <UserImage
            user={{
              id:authDetails?.user?.id,
              full_name:authDetails?.user?.full_name,
              profile_pic:authDetails?.user?.profile_pic
            }}
            size={32}
            rounded="rounded-md bg-gray-100"
          />
        </Link>
      </div>

      {isPanelOpen && (
        <Portal>
          <div ref={panelRef} className="fixed z-10000 right-4 top-14">
            <NotificationPanel onClose={() => setIsPanelOpen(false)} />
          </div>
        </Portal>
      )}
    </header>
  );
};

export default Navbar;
