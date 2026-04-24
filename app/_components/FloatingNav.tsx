"use client";

import { useState, useRef, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Settings, User, LayoutGrid, Store } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { useRouter } from "next/navigation";

const FloatingNav = () => {
  const { authDetails } = useContext(AuthContext);
  const router = useRouter();
  const user = authDetails?.user && authDetails?.user?.role == "buyer";
  const constraintsRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const BUTTON_SIZE = 48;
  const EDGE_THRESHOLD = 100; // 💡 Only snaps if within 100px of an edge
  const PADDING = 20;

  useEffect(() => {
    setPos({
      x: window.innerWidth - BUTTON_SIZE - PADDING,
      y: window.innerHeight - BUTTON_SIZE - PADDING * 4,
    });
  }, []);

  if (!user) return null;

  const navItems = [
    { icon: <Home size={20} />, path: "/buyer" },
    { icon: <Store size={20} />, path: "/marketplace" },
    { icon: <Settings size={20} />, path: "/buyer/settings" },
    { icon: <User size={20} />, path: "/buyer/profile" },
  ];

  /**
   * 🍃 MINIMAL SNAP LOGIC
   * Only sticks to the wall if the user drops it very close to one.
   * Otherwise, it stays exactly where the finger let go.
   */
  const handleSnap = (currentX: number, currentY: number) => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    let finalX = currentX;
    let finalY = currentY;

    // Snap X if close to sides
    if (currentX < EDGE_THRESHOLD) finalX = PADDING;
    else if (currentX > w - BUTTON_SIZE - EDGE_THRESHOLD)
      finalX = w - BUTTON_SIZE - PADDING;

    // Snap Y if close to top/bottom
    if (currentY < EDGE_THRESHOLD) finalY = PADDING;
    else if (currentY > h - BUTTON_SIZE - EDGE_THRESHOLD)
      finalY = h - BUTTON_SIZE - PADDING;

    return { x: finalX, y: finalY };
  };

  return (
    <div
      ref={constraintsRef}
      className="fixed inset-0 z-50 pointer-events-none"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/10 backdrop-blur-[1.5px] z-40 pointer-events-auto"
          />
        )}
      </AnimatePresence>

      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.05} // Stiffer drag so it doesn't feel "mushy"
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setTimeout(() => setIsDragging(false), 50);
          const newPos = handleSnap(info.point.x, info.point.y);
          setPos(newPos);
        }}
        animate={pos}
        // ✨ Smoother, slower transition for a "premium" feel
        transition={{ type: "spring", stiffness: 200, damping: 30, mass: 0.8 }}
        className="absolute top-0 left-0 w-12 h-12 z-50 pointer-events-auto touch-none"
      >
        <AnimatePresence>
          {isOpen && (
            <div className="absolute inset-0 flex items-center justify-center">
              {navItems.map((item, i) => {
                // Adaptive menu expansion based on screen side
                const isLeft = pos.x < window.innerWidth / 2;
                const isTop = pos.y < window.innerHeight / 2;

                const angleBase = isTop
                  ? isLeft
                    ? 45
                    : 135
                  : isLeft
                    ? 315
                    : 225;
                const angle = (angleBase - 45 + i * 30) * (Math.PI / 180);
                const radius = 85;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: 1,
                      x: Math.cos(angle) * radius,
                      y: Math.sin(angle) * radius,
                      scale: 1,
                    }}
                    exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    className="absolute"
                  >
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push(item.path);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-neutral-800 shadow-lg border border-neutral-50"
                    >
                      {item.icon}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => !isDragging && setIsOpen(!isOpen)}
          className={`w-full h-full flex items-center justify-center rounded-full text-white shadow-xl ${
            isOpen ? "bg-neutral-800" : "bg-[#FF4B2B]"
          }`}
        >
          {isOpen ? <X size={18} /> : <LayoutGrid size={18} />}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default FloatingNav;
