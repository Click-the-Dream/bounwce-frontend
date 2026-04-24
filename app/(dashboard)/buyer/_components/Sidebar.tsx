"use client";

import { Compass, Home, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "../../../assets/bouwnce-main.png";
import logoIcon from "../../../assets/bouwnce-icon.png";
import { LuSquareUserRound } from "react-icons/lu";
import { PiDotsNineBold } from "react-icons/pi";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({
  isMobile,
  onClose,
}: {
  isMobile?: boolean;
  onClose?: () => void;
}) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => pathname === path;
  const onToggleCollapse = () => setCollapsed(!collapsed);

  const navItems = [
    { name: "Home", href: "/buyer", icon: Home },
    { name: "Explore", href: "/buyer/explore", icon: Compass },
    { name: "Profile", href: "/buyer/profile", icon: LuSquareUserRound },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`
        h-screen bg-white lg:flex flex-col border-r-[0.53px] border-[#00000033]
        ${isMobile ? "flex" : "hidden lg:flex"}
      `}
    >
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

      <nav
        className={`relative h-full space-y-2 text-[13px] px-2.5 pt-5.75 ${collapsed ? "pr-4" : "pr-7.5"} transition-all duration-300`}
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
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
            </Link>
          );
        })}

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
      </nav>
    </motion.aside>
  );
};

export default Sidebar;
