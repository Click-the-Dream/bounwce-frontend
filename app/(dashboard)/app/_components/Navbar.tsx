import { Bell, Menu, ShoppingCart, MessageCircleMore } from "lucide-react";
import userImg from "../../../assets/buyer/user.jpg";
import Image from "next/image";
import SearchComponent from "./SearchComponent";
import Link from "next/link";
import { useMarketStore } from "@/app/context/StoreContext";
import { useNotifications } from "@/app/context/NotificationContext";

const Navbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { carts } = useMarketStore();
  const { totalUnread, unreadCount } = useNotifications();

  return (
    <header className="h-13.75 flex items-center justify-between py-2.25 px-4 md:px-6 lg:px-8 bg-white border-b border-[#00000033] sticky top-0 z-10">
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
        <Link href="/marketplace/carts" className="mr-0 md:mr-2">
          <div className="relative flex items-center justify-center size-9 bg-[#ECECF0] rounded-xl cursor-pointer hover:bg-gray-200 transition-colors">
            <ShoppingCart strokeWidth={1.5} className="size-5" />
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4.5 h-4.5 bg-orange text-white text-[9px] rounded-full px-1">
              {carts?.length || 0}
            </span>
          </div>
        </Link>
        <Link href="/app/chat" className="relative">
          <MessageCircleMore className="shrink-0 size-5 cursor-pointer" />
          {totalUnread > 0 && (
            <span className="absolute -top-2 -right-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">
              {totalUnread}
            </span>
          )}
        </Link>

        <div className="relative cursor-pointer">
          <Bell strokeWidth={1.5} className="size-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-2 -right-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">
              {totalUnread}
            </span>
          )}
        </div>

        <Link href="/app/profile" className="w-8 h-8">
          <Image
            src={userImg}
            alt="Profile"
            width={32}
            height={32}
            className="rounded-md w-full h-full"
          />
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
