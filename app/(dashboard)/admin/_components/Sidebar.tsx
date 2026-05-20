"use client";

import {
  LayoutDashboard,
  Users,
  Store,
  Receipt,
  Settings,
  X,
  LogOut,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { PiDotsNineBold } from "react-icons/pi";

import logo from "../../../assets/bouwnce-main.png";
import logoIcon from "../../../assets/bouwnce-icon.png";

import useAuthServices from "@/app/hooks/use-authservices";
import { STORES, VENDORS } from "@/app/_utils/mock";
import { useAuth } from "@/app/context/AuthContext";

const AdminSidebar = ({
  isMobile,
  onClose,
}: {
  isMobile?: boolean;
  onClose?: () => void;
}) => {
  const pathname = usePathname();
  const { logout } = useAuthServices();
  const { authDetails } = useAuth();

  const userName = authDetails?.user?.full_name;
  const [collapsed, setCollapsed] = useState(false);

  const pendingCount =
    VENDORS.filter((v) => v.status === "pending").length +
    STORES.filter((s) => s.status === "pending").length;

  const isActive = (path: string) => pathname.startsWith(path);

  const onToggleCollapse = () => setCollapsed(!collapsed);

  const navItems = [
    {
      name: "Overview",
      href: "/admin/overview",
      icon: LayoutDashboard,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Vendors",
      href: "/admin/vendors",
      icon: Store,
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: Receipt,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{
        width: collapsed ? 80 : 256,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className={`
        shrink-0 h-screen bg-white flex flex-col
        border-r-[0.53px] border-[#00000033]

        ${isMobile ? "flex" : "hidden lg:flex"}
      `}
    >
      {/* HEADER */}
      <div
        className={`h-14 flex items-center px-3 py-6.5 border-b mb-4 border-[#00000033] ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div key="icon" className="flex items-center justify-center">
              <Image src={logoIcon.src} alt="logo" width={30} height={30} />
            </motion.div>
          ) : (
            <motion.div key="full">
              <Image src={logo.src} alt="logo" width={100} height={30} />
            </motion.div>
          )}
        </AnimatePresence>

        {isMobile && (
          <button onClick={onClose} className="p-2 lg:hidden">
            <X className="size-5 text-red-500" />
          </button>
        )}
      </div>

      {/* NAV */}
      <nav className="relative flex flex-col h-full space-y-2 text-[13px] px-2.5 pt-5.5">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center p-3 rounded-[7px] gap-2
                transition-colors
                ${collapsed ? "justify-center" : "justify-start"}
                ${
                  active
                    ? "bg-[#EFEFEF] text-black font-medium"
                    : "text-[#333D42] hover:bg-[#F5F5F5]"
                }
              `}
            >
              <item.icon size={18} className={collapsed ? "" : "mr-3"} />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{
                      opacity: 0,
                      width: 0,
                    }}
                    animate={{
                      opacity: 1,
                      width: "auto",
                    }}
                    exit={{
                      opacity: 0,
                      width: 0,
                    }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* badge */}
              {!collapsed && item.name === "Vendors" && pendingCount > 0 && (
                <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* COLLAPSE */}
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

        {/* FOOTER */}
        <button
          onClick={() => logout.mutate()}
          className={`
            mt-auto mb-4 flex items-center p-3 rounded-[7px]
            text-red-600 hover:bg-red-50
            ${collapsed ? "justify-center" : "justify-start"}
          `}
        >
          <LogOut size={18} />
          {!collapsed && <span className="ml-3">Logout</span>}
        </button>
      </nav>
    </motion.aside>
  );
};

export default AdminSidebar;
