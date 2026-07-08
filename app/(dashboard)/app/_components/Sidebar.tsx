"use client";

import {
  Compass,
  Home,
  X,
  Briefcase,
  LogOut,
  UserPlus,
  LucideProps,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "../../../assets/bouwnce-main.png";
import logoIcon from "../../../assets/bouwnce-icon.png";
import { LuSquareUserRound } from "react-icons/lu";
import { PiDotsNineBold } from "react-icons/pi";
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import useAuthServices from "@/app/hooks/use-authservices";
import useMatch from "@/app/hooks/use-match";
import LogoutModal from "./LogoutModal";

const EventCustomIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className, strokeWidth, ...props }, ref) => (
    <svg
      ref={ref}
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ strokeWidth: strokeWidth ?? 1 }}
      {...props}
    >
      <path
        d="M7.49989 14.4992C8.35902 14.4992 9.05545 13.8724 9.05545 13.0992C9.05545 12.326 8.35902 11.6992 7.49989 11.6992C6.64076 11.6992 5.94434 12.326 5.94434 13.0992C5.94434 13.8724 6.64076 14.4992 7.49989 14.4992Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.83344 0.5H5.16678C3.70018 0.5 2.96689 0.5 2.51128 0.910053C2.05566 1.3201 2.05566 1.98007 2.05566 3.3V5.4C2.05566 6.71992 2.05566 7.37988 2.51128 7.78994C2.96689 8.2 3.70018 8.2 5.16678 8.2H6.33344L7.50011 9.6L8.66678 8.2H9.83344C11.3 8.2 12.0333 8.2 12.4889 7.78994C12.9446 7.37988 12.9446 6.71992 12.9446 5.4V3.3C12.9446 1.98007 12.9446 1.3201 12.4889 0.910053C12.0333 0.5 11.3 0.5 9.83344 0.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.16699 3.30078H7.50033"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.16699 5.39844H9.83366"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.05556 13.1016H14.5M5.94444 13.1016H0.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
);

EventCustomIcon.displayName = "EventCustomIcon";

const Sidebar = ({
  isMobile,
  onClose,
}: {
  isMobile?: boolean;
  onClose?: () => void;
}) => {
  const pathname = usePathname();
  const { authDetails } = useAuth();
  const { logout } = useAuthServices();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { useGetMatchRequests } = useMatch();
  const { data } = useGetMatchRequests();

  const isActive = (path: string) => pathname === path;
  const onToggleCollapse = () => setCollapsed(!collapsed);

  const handleLogoutConfirm = () => {
    logout.mutate(undefined, {
      onSettled: () => setShowLogoutModal(false),
    });
  };

  const navItems = useMemo(() => {
    const items = [
      { name: "Home", href: "/app", icon: Home },
      { name: "Explore", href: "/app/explore", icon: Compass },
      {
        name: "Requests",
        href: "/app/requests",
        icon: UserPlus,
        badge: data?.total,
      },
      { name: "Profile", href: "/app/profile", icon: LuSquareUserRound },
    ];

    if (authDetails?.user?.role === "vendor") {
      items.push({
        name: "Business Hub",
        href: "/vendor",
        icon: Briefcase,
      });
    }

    if (authDetails?.user) {
      items.push({
        name: "Events",
        href: "/app/events",
        icon: EventCustomIcon,
      });
    }

    return items;
  }, [authDetails?.user?.role, data?.total]);

  return (
    <>
      {/* ── Logout confirmation modal (rendered outside the aside so it's truly centered) */}
      <LogoutModal
        open={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
        isLoading={logout.isPending}
      />

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          shrink-0 h-full bg-white lg:flex flex-col border-r-[0.53px] border-[#00000033]
          ${isMobile ? "flex" : "hidden lg:flex"}
        `}
      >
        {/* Header */}
        <div
          className={`h-14 flex items-center px-3 py-6.5 bg-white border-b-[0.53px] border-[#00000033] relative overflow-hidden ${
            collapsed ? "justify-center" : "justify-start"
          }`}
        >
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.div
                key="icon"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center"
              >
                <Image
                  src={logoIcon.src}
                  alt="LogoIcon"
                  width={30}
                  height={30}
                  className="h-7.5 w-auto"
                />
              </motion.div>
            ) : (
              <motion.div
                key="full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <Image src={logo.src} alt="Bouwnce" width={100} height={30} />
              </motion.div>
            )}
          </AnimatePresence>

          {isMobile && (
            <button
              onClick={onClose}
              className="ml-auto p-2 rounded-md hover:bg-gray-100 transition"
            >
              <X className="size-5 text-red-500" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav
          className={`flex flex-col relative h-full space-y-2 text-[13px] px-2.5 pt-5.75 ${collapsed ? "pr-4" : "pr-7.5"} transition-all duration-300`}
        >
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <React.Fragment key={item.name}>
                {item.name === "Events" && (
                  <hr className="border-t-[0.53px] border-[#00000033] my-2" />
                )}

                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`
                  w-full flex items-center p-3 rounded-[7px] transition-colors
                  ${collapsed ? "justify-center" : "justify-start"}
                  ${active ? "bg-[#EFEFEF] text-black font-medium" : "text-[#333D42] hover:bg-[#F5F5F5] font-medium"}
                `}
                >
                  <item.icon
                    strokeWidth={active ? 2 : 1}
                    className={`size-5 shrink-0 ${collapsed ? "" : "mr-3.25"}`}
                  />

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden whitespace-nowrap ml-3"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {typeof item.badge === "number" && item.badge > 0 ? (
                    <span className="ml-auto text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </React.Fragment>
            );
          })}

          {/* Collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="cursor-pointer absolute -right-3.75 top-10 z-50 hidden lg:flex h-7 w-7 items-center justify-center border-[0.53px] border-[#00000022] bg-white transition-all hover:bg-[#F5F5F5] hover:scale-110 active:scale-95"
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <PiDotsNineBold size={16} />
            </motion.div>
          </button>

          {/* Logout button — now opens modal */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`cursor-pointer 
              w-full flex mt-auto mb-3 items-center p-3 rounded-[7px] transition-colors text-red-600 hover:bg-red-50
              ${collapsed ? "justify-center" : "justify-start"}
            `}
          >
            <LogOut
              size={20}
              className={`shrink-0 ${collapsed ? "" : "mr-3.25"}`}
            />
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </button>
        </nav>
      </motion.aside>
    </>
  );
};

export default Sidebar;
