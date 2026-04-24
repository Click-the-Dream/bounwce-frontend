"use client";
import { useState, useRef } from "react";
import { Play } from "lucide-react";
import navLogo from "../assets/bouwnce-main.png";
import { useAuth } from "../context/AuthContext";
import { useScroll, useMotionValueEvent } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
  const { authDetails } = useAuth();
  const user = authDetails?.user;
  const [isFixed, setIsFixed] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (triggerRef.current) {
      // Logic: If scrolled past the top of our placeholder
      const triggerPoint = triggerRef.current.offsetTop;
      setIsFixed(latest > triggerPoint);
    }
  });

  return (
    <>
      <div ref={triggerRef} className="h-12.25 mt-4" />

      <div
        className={`w-full flex justify-center px-4 transition-all duration-300 ${
          isFixed
            ? "fixed top-3 left-0 z-50 animate-in fade-in slide-in-from-top-2"
            : "absolute top-4 left-0"
        }`}
      >
        <nav
          style={{
            boxShadow:
              "22px 18px 8px 0px #00000000, 0px 0px 4px 0px #00000040 inset",
          }}
          className="w-full max-w-250 h-12.25 p-2.25 flex items-center justify-between gap-4 rounded-[15px] border-[0.83px] border-[#0000001A] bg-white"
        >
          {/* Logo */}
          <div className="flex items-center gap-2 ml-2">
            <Image
              src={navLogo}
              alt="logo"
              className="h-4 w-auto"
              width={100}
              height={20}
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {!user && (
              <Link
                href="/waitlist"
                className="flex h-8.5 justify-between items-center gap-2 text-[13px] px-6.25 py-1.5 bg-orange text-black font-bold rounded-lg border-2 border-black transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
              >
                Sign Up
                <Play size={10} fill="#FFC501" />
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
