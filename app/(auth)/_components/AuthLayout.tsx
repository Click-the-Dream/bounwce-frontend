"use client";

import { cubicBezier, motion } from "framer-motion";
import createPicImg from "../../assets/createpic.jpg";
import { usePathname } from "next/navigation";
import Logo from "@/app/_components/common/Logo";
import navLogo from "../../assets/bouwnce-main.png";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import ToggleTabs from "@/app/(dashboard)/vendor/_components/ToggleTabs";

// Animation variants for smooth fade-in effects
const fadeIn = (direction = "up", delay = 0) => ({
  hidden: {
    opacity: 0,
    y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
    x: direction === "left" ? 40 : direction === "right" ? -40 : 0,
  },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: 0.6,
      ease: cubicBezier(0.25, 0.1, 0.25, 1),
      delay,
    },
  },
});

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [path, setPath] = useState<string | null>(null);

  useEffect(() => {
    setPath(pathname);
  }, [pathname]);

  const isLogin = path === "/login";
  const isCreateAccount = path === "/register";
  const isVerificationPage =
    path?.startsWith("/email_verification") || path?.startsWith("/verify");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* --- Left Illustration Section (Animates Only Once) --- */}
      <div className="hidden md:block relative w-[55%] h-full">
        <div className="w-full h-full relative">
          <Image
            src={createPicImg.src}
            alt="workspace"
            width={500}
            height={800}
            className="[clip-path:polygon(0_0,100%_0,80%_100%,0_100%)] object-cover w-full h-full"
          />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30 [clip-path:polygon(0_0,100%_0,80%_100%,0_100%)]" />

        {/* Branding */}
        <motion.div
          className="absolute top-8 left-8 text-white font-extrabold text-xl tracking-tight"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link href="/">
            <Image
              src={navLogo.src}
              alt="bouwnce"
              width={100}
              height={40}
              loading="eager"
              className="h-4 w-auto mb-4 hidden md:block invert brightness-0"
            />
          </Link>
        </motion.div>

        {/* Tagline */}
        <motion.div
          className="absolute bottom-12 left-10 text-white"
          variants={fadeIn("up", 0.6)}
          initial="hidden"
          animate="show"
        >
          <h2 className="text-2xl font-bold">Grow. Connect. Build.</h2>
          <p className="text-sm text-white/70">
            Join a community built for creators and doers.
          </p>
        </motion.div>
      </div>

      {/* --- Right Content Section (Re-animates on Route Change) --- */}
      <div className="flex-1 flex flex-col items-center px-4 md:px-6mdpx-12 bg-white overflow-y-auto">
        <div className="my-auto w-full max-w-100">
          {isVerificationPage ? (
            // --- Minimal Layout for Verification Pages ---
            <div className="w-full">{children}</div>
          ) : (
            <>
              <div className="flex md:hidden justify-center mb-4 ">
                <Logo size={120} />
              </div>
              <motion.h1
                key={`title-${path}`}
                variants={fadeIn("up", 0.3)}
                className="text-orange text-2xl md:text-3xl font-semibold mb-2 tracking-tight text-center"
              >
                {isCreateAccount ? "Create Account" : "Welcome Back"}
              </motion.h1>

              {isLogin && (
                <motion.p
                  key={`subtitle-${pathname}`}
                  variants={fadeIn("up", 0.4)}
                  className="text-gray-500 text-sm mb-6 text-center"
                >
                  Enter your email to access your account
                </motion.p>
              )}

              {/* Tabs */}
              <div className="max-w-92 h-10.5">
                <ToggleTabs
                  tabs={[
                    { label: "Login", path: "/login" },
                    { label: "Create Account", path: "/register" },
                  ]}
                  activePath={path}
                />
              </div>

              {/* Page Content */}
              <motion.div
                key={`content-${path}`}
                variants={fadeIn("up", 0.6)}
                className="w-full mt-6"
              >
                {children}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
