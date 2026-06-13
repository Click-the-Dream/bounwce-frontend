"use client";
import { useState, useRef, useEffect } from "react";
import { Menu, Play, X } from "lucide-react";
import navLogo from "../assets/bouwnce-main.png";
import { useAuth } from "../context/AuthContext";
import { useScroll, useMotionValueEvent } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { navLinks } from "../_utils/fields";
import { usePathname } from "next/navigation";
import ProfileDropdown from "../marketplace/_components/ProfileDropdown";

const Navbar = () => {
  const { authDetails } = useAuth();
  const user = authDetails?.user;
  const [isFixed, setIsFixed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const triggerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (triggerRef.current) {
      // Logic: If scrolled past the top of our placeholder
      const triggerPoint = triggerRef.current.offsetTop;
      setIsFixed(latest > triggerPoint);
    }
  });
  useEffect(() => {
    setIsOpen(false); // close menu on route change
  }, [pathname]);
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
                href="/register"
                className="flex h-8.5 justify-between items-center gap-2 text-[13px] px-6.25 py-1.5 bg-orange text-black font-bold rounded-lg border-2 border-black transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
              >
                Sign Up
                <Play size={10} fill="#FFC501" />
              </Link>
            )}

            {/* Mobile Toggle */}
            {/* <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden flex items-center justify-center w-8.5 h-8.5 rounded-lg border-2 border-black bg-white transition-all active:scale-90"
            >
              {isOpen ? (
                <X size={18} strokeWidth={2.5} />
              ) : (
                <Menu size={18} strokeWidth={2.5} />
              )}
            </button> */}

            {user && <ProfileDropdown />}
          </div>

          {isOpen && (
            <div className="absolute top-15 left-4 right-4 bg-white border-2 border-black rounded-[15px] shadow-xl p-6 md:hidden z-50">
              <ul className="flex flex-col gap-5">
                {navLinks.map((link: { name: string; path: string }) => (
                  <Link
                    key={link.name}
                    href={link.path}
                    className="text-[13px] font-bold text-gray-700 hover:text-black border-b border-gray-100 pb-2"
                  >
                    {link.name}
                  </Link>
                ))}
                <li>
                  {!user && (
                    <Link
                      href="/register"
                      className="text-[13px] w-full h-11.25 flex justify-center items-center gap-2 bg-orange text-black font-bold rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      Sign Up <Play size={12} fill="#FFC501" />
                    </Link>
                  )}
                </li>
              </ul>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default Navbar;
