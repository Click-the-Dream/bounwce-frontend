"use client";

import { ArrowLeft, ArrowRight, Grid3X3, Focus } from "lucide-react";
import { DiscoveryCard } from "./DiscoveryCard";
import { useRouter } from "next/navigation";
import { slugify } from "@/app/_utils/slugify";
import { loadingSteps } from "@/app/_utils/dummy";
import { useState, useRef } from "react";
import { motion, useMotionValue, animate, PanInfo } from "framer-motion";

interface DiscoveryResultsProps {
  isSearching: boolean;
  currentIndex: number;
  searchResults: any[];
  loadingStep: number;
  urlQuery?: string;
  setCurrentIndex: (index: number) => void;
}

const SWIPE_THRESHOLD = 50;

const DiscoveryResults = ({
  currentIndex,
  searchResults,
  setCurrentIndex,
  isSearching,
  loadingStep,
  urlQuery,
}: DiscoveryResultsProps) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"single" | "grid">("single");
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const dragDirection = useRef<null | 1 | -1>(null);
  const dragOrigin = useRef(0);
  const trackX = useMotionValue(0);

  const [staged, setStaged] = useState<{
    left: number;
    right: number | null;
  }>({ left: currentIndex, right: null });

  const currentUser = searchResults?.[currentIndex];
  const hasNext = currentIndex < searchResults.length - 1;
  const hasPrev = currentIndex > 0;

  const getWidth = () => containerRef.current?.offsetWidth ?? 600;

  const goToProfile = (user: any) => {
    router.push(`/app/profile/${slugify(user.full_name)}_${user.user_id}`);
  };

  const resetToCurrentOnly = (idx: number) => {
    setStaged({ left: idx, right: null });
    trackX.set(0);
    dragDirection.current = null;
    dragOrigin.current = 0;
  };

  const triggerChange = (dir: 1 | -1, alreadyStaged = false) => {
    if (isAnimating.current) return;
    if (dir === 1 && !hasNext) return;
    if (dir === -1 && !hasPrev) return;

    const width = getWidth();
    const nextIndex = currentIndex + dir;
    isAnimating.current = true;

    if (dir === 1) {
      if (!alreadyStaged) {
        setStaged({ left: currentIndex, right: nextIndex });
        trackX.set(0);
      }
      animate(trackX, -width, {
        type: "spring",
        stiffness: 380,
        damping: 36,
        restDelta: 0.5,
        onComplete: () => {
          setCurrentIndex(nextIndex);
          resetToCurrentOnly(nextIndex);
          isAnimating.current = false;
        },
      });
    } else {
      if (!alreadyStaged) {
        setStaged({ left: nextIndex, right: currentIndex });
        trackX.set(-width);
      }
      animate(trackX, 0, {
        type: "spring",
        stiffness: 380,
        damping: 36,
        restDelta: 0.5,
        onComplete: () => {
          setCurrentIndex(nextIndex);
          resetToCurrentOnly(nextIndex);
          isAnimating.current = false;
        },
      });
    }
  };

  const handleDragStart = () => {
    if (isAnimating.current) return;
    dragOrigin.current = trackX.get();
    dragDirection.current = null;
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (isAnimating.current) return;

    const { offset } = info;
    const width = getWidth();

    if (dragDirection.current === null) {
      if (offset.x < -8 && hasNext) {
        dragDirection.current = 1;
        setStaged({ left: currentIndex, right: currentIndex + 1 });
        dragOrigin.current = 0;
      } else if (offset.x > 8 && hasPrev) {
        dragDirection.current = -1;
        setStaged({ left: currentIndex - 1, right: currentIndex });
        dragOrigin.current = -width;
      } else {
        return;
      }
    }

    const raw = dragOrigin.current + offset.x;
    trackX.set(Math.max(-width, Math.min(0, raw)));
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (isAnimating.current) return;

    const { offset, velocity } = info;
    const width = getWidth();
    const isFastFlick = Math.abs(velocity.x) > 500;
    const isPastThreshold = Math.abs(offset.x) > SWIPE_THRESHOLD;
    const shouldChange = isFastFlick || isPastThreshold;

    if (shouldChange && dragDirection.current === 1) {
      triggerChange(1, true);
    } else if (shouldChange && dragDirection.current === -1) {
      triggerChange(-1, true);
    } else {
      const snapTo = dragDirection.current === -1 ? -width : 0;
      animate(trackX, snapTo, {
        type: "spring",
        stiffness: 400,
        damping: 36,
        onComplete: () => resetToCurrentOnly(currentIndex),
      });
    }

    dragDirection.current = null;
  };

  const renderCard = (index: number) => {
    const user = searchResults[index];
    if (!user) return null;
    return (
      <div
        key={user.user_id}
        className="shrink-0 bg-white border border-gray-200 rounded-xl p-4 md:p-5"
        style={{ width: "100%" }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          <div className="flex-1 min-w-0">
            <DiscoveryCard currentUser={user} />
          </div>
          <button
            onClick={() => goToProfile(user)}
            className="w-full md:w-auto text-xs md:text-[13px] px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition"
          >
            View profile
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full max-w-2xl space-y-3 mb-5">
      {/* LOADING */}
      {isSearching && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-2">Bouwnce</p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce delay-150" />
            </div>
            <span className="text-sm text-gray-700">
              {loadingSteps[loadingStep]}
            </span>
          </div>
        </div>
      )}

      {/* EMPTY */}
      {!isSearching && !currentUser && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm">
          No matches found for "{urlQuery}"
        </div>
      )}

      {/* HEADER */}
      {!isSearching && currentUser && (
        <div className="flex items-center justify-between">
          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[11px]">
            Suggested connections
          </div>
          <button
            onClick={() =>
              setViewMode((p) => (p === "single" ? "grid" : "single"))
            }
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition"
          >
            {viewMode === "single" ? (
              <Grid3X3 className="w-4 h-4 text-gray-700" />
            ) : (
              <Focus className="w-4 h-4 text-gray-700" />
            )}
          </button>
        </div>
      )}

      {/* SWIPE MODE */}
      {!isSearching && currentUser && viewMode === "single" && (
        <div className="space-y-3">
          <div ref={containerRef} className="overflow-hidden rounded-xl">
            <motion.div
              className="flex will-change-transform touch-pan-y cursor-grab active:cursor-grabbing"
              style={{ x: trackX }}
              onPanStart={handleDragStart}
              onPan={handleDrag}
              onPanEnd={handleDragEnd}
            >
              {renderCard(staged.left)}
              {staged.right !== null && renderCard(staged.right)}
            </motion.div>
          </div>

          {/* NAV */}
          <div className="flex justify-between items-center px-1">
            <button
              onClick={() => triggerChange(-1)}
              disabled={!hasPrev}
              className="cursor-pointer flex items-center gap-1 text-xs text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed "
            >
              <ArrowLeft className="w-3 h-3" />
              Prev
            </button>

            <div className="flex items-center gap-1">
              {searchResults.length <= 8 ? (
                searchResults.map((_, i) => (
                  <span
                    key={i}
                    className={`block rounded-full transition-all duration-200 ${
                      i === currentIndex
                        ? "w-3 h-1.5 bg-orange"
                        : "w-1.5 h-1.5 bg-gray-300"
                    }`}
                  />
                ))
              ) : (
                <span className="text-[10px] text-gray-400">
                  {currentIndex + 1} / {searchResults.length}
                </span>
              )}
            </div>

            <button
              onClick={() => triggerChange(1)}
              disabled={!hasNext}
              className="cursor-pointer flex items-center gap-1 text-xs text-orange disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* GRID MODE */}
      {!isSearching && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {searchResults.map((user) => (
            <div
              key={user.user_id}
              onClick={() => goToProfile(user)}
              className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-sm transition"
            >
              <DiscoveryCard currentUser={user} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoveryResults;
