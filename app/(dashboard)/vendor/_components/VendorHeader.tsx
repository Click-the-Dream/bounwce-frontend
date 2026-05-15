"use client";
import { TbHome } from "react-icons/tb";
import { IoLogOutOutline, IoSettingsOutline } from "react-icons/io5";
import userImage from "../../../assets/createpic.jpg";
import { useState, useEffect } from "react";
import { useRef } from "react";
import useAuthServices from "@/app/hooks/use-authservices";
import Image from "next/image";
import { ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";

const VendorHeader = ({
  storeName,
  header,
  onClose,
  headerDetails,
  notifications,
  onFirstClick,
  onSecondClick,
  isBackButton,
  label,
  icon: Icon,
  bgColor,
  storeLabel,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
}: any) => {
  const { logout } = useAuthServices();
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<any>(null);
const router = useRouter();
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow py-5 px-4 md:px-12 xl:px-35 2xl:px-43.75 flex justify-between items-center gap-2">
      <div className="flex gap-3 items-center">
        {isBackButton && (
          <button
            className="p-2 bg-[#FFFFFF] border  border-[#0000001A] rounded-[3px] text-[13px] mr-6"
            onClick={onClose}
          >
            Back
          </button>
        )}
        <div>
          <Image
            src={userImage}
            alt="user_image"
            width={60}
            className="w-14 aspect-square rounded-full object-cover"
          />
        </div>

        <div className="hidden md:block">
          <div className="flex gap-1 items-center">
            <TbHome className="shrink-0" />
            <p className="text-xs md:text-sm lg:text-base font-semibold capitalize">
              <span>{storeName?.split(" ")[0]}</span> - {header}
            </p>
          </div>
          <p className="text-[10px] lg:text-[13px] text-[#717182]">
            {headerDetails}
          </p>
        </div>
      </div>

      {storeLabel && (
        <div className="flex gap-2 h-max">
          <button
            className="cursor-pointer flex items-center gap-2 py-1.5 px-2.75 border-2 border-[#00000036] rounded-md"
            onClick={onFirstClick}
          >
            {LeftIcon && <LeftIcon size={15} />}
            <p className="text-[12px] hidden lg:block">{storeLabel}</p>
            {RightIcon && <RightIcon size={12} className="hidden md:block" />}
          </button>

          <button
            className={`cursor-pointer relative border-2 border-[#0000001A] py-2 px-3 flex items-center rounded-md ${bgColor}`}
            onClick={onSecondClick}
          >
            {Icon && <Icon />}
            {label && (
              <p className="text-[12px] ml-2 hidden lg:block">{label}</p>
            )}
            {notifications && (
              <p className="absolute -top-2.5 -right-0.75 px-1.25 py-0.75 bg-red-600 text-[8px] text-white rounded-full w-3.75 h-3.75 aspect-square">
                {notifications}
              </p>
            )}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              className={`cursor-pointer border-2 py-1.5 px-3 flex items-center rounded-md transition-colors border-[#0000001A] ${
                showSettings ? "bg-gray-100 border-gray-400" : "bg-white "
              }`}
              onClick={() => setShowSettings(!showSettings)}
            >
              <IoSettingsOutline
                className={
                  showSettings
                    ? "rotate-45 transition-transform"
                    : "transition-transform"
                }
              />
            </button>

            {/* Logout Dropdown */}
            {showSettings && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-[#0000001A] rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => {
                    setShowSettings(false);
                    if (logout) logout.mutate();
                  }}
                  className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <IoLogOutOutline size={18} />
                  <span className="font-medium">Logout</span>
                </button>
<button
  onClick={() => router.push("/app")}
  className="w-full flex items-center gap-2 p-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
>
  <ArrowLeftRight className="size-4" />
  Switch to App
</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default VendorHeader;
