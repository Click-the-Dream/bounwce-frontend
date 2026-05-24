"use client";

import { motion } from "framer-motion";
import Logo from "./common/Logo";

type FallbackProps = {
  message?: string;
  subMessage?: string;
  statusText?: string;
};

function Fallback({
  message = "Loading your experience",
  subMessage = "Please wait while we prepare everything for you",
  statusText = "Initializing",
}: FallbackProps) {
  return (
    <main className="w-full h-screen bg-[#faf9f7] relative overflow-hidden flex flex-col justify-center items-center">
      {/* Ambient blobs */}
      <div className="absolute w-80 h-72 rounded-full bg-orange/6 blur-3xl -top-16 -right-20 pointer-events-none" />
      <div className="absolute w-52 h-52 rounded-full bg-orange-200/8 blur-3xl -bottom-10 -left-10 pointer-events-none" />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="flex flex-col items-center gap-7 z-10 text-center"
      >
        {/* Logo mark */}

        <Logo size={150} />

        {/* Orbital loader */}
        <div
          className="relative w-30 h-30 flex items-center justify-center"
          aria-hidden="true"
        >
          {/* Rings */}
          <Ring size={118} opacity={0.07} duration={8} />
          <Ring size={88} opacity={0.15} duration={5} reverse />
          <Ring size={52} opacity={0.35} duration={3} />

          {/* Orbiting dots — ring 1 */}
          <OrbitDot radius={26} size={7} duration={3} delay={0} />
          <OrbitDot radius={26} size={7} duration={3} delay={1.5} />

          {/* Orbiting dots — ring 2 */}
          <OrbitDot radius={44} size={5} duration={5} delay={0} faint />
          <OrbitDot radius={44} size={5} duration={5} delay={2.5} faint />
          <OrbitDot radius={44} size={5} duration={5} delay={1.25} faint />

          {/* Pulsing core */}
          <motion.div
            className="w-4.5 h-4.5 rounded-full bg-orange z-3 relative"
            animate={{ scale: [1, 1.25, 1], opacity: [1, 0.85, 1] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[15px] font-medium text-[#1a1816] tracking-tight leading-snug">
            {message}
          </p>
          <p className="text-[13px] font-light text-[#9a9690] tracking-wide max-w-57.5 leading-relaxed">
            {subMessage}
          </p>
        </div>

        {/* Progress bar + status */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-40 h-0.75 rounded-full bg-orange/12 overflow-hidden relative">
            <motion.div
              className="absolute left-0 top-0 h-full w-[45%] bg-orange rounded-full"
              animate={{ left: ["-45%", "100%", "100%"] }}
              transition={{
                duration: 1.8,
                ease: "easeInOut",
                repeat: Infinity,
                times: [0, 0.6, 1],
              }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-orange"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{
                duration: 1.4,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
            <span className="text-[11px] font-normal text-[#c0b8b0] tracking-[0.06em] uppercase">
              {statusText}
            </span>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function Ring({
  size,
  opacity,
  duration,
  reverse = false,
}: {
  size: number;
  opacity: number;
  duration: number;
  reverse?: boolean;
}) {
  return (
    <motion.div
      className="absolute rounded-full border-[1.5px]"
      style={{
        width: size,
        height: size,
        top: "50%",
        left: "50%",
        marginTop: -(size / 2),
        marginLeft: -(size / 2),
        borderColor: `rgba(232,69,10,${opacity})`,
      }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, ease: "linear", repeat: Infinity }}
    />
  );
}

function OrbitDot({
  radius,
  size,
  duration,
  delay,
  faint = false,
}: {
  radius: number;
  size: number;
  duration: number;
  delay: number;
  faint?: boolean;
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-orange"
      style={{
        width: size,
        height: size,
        top: "50%",
        left: "50%",
        marginTop: -(size / 2),
        marginLeft: -(size / 2),
        opacity: faint ? 0.55 : 1,
        originX: "50%",
        originY: "50%",
      }}
      animate={{
        rotate: 360,
        x: [radius, 0, -radius, 0, radius],
        y: [0, -radius, 0, radius, 0],
      }}
      transition={{
        duration,
        ease: "linear",
        repeat: Infinity,
        delay: -delay,
      }}
    />
  );
}

export default Fallback;
