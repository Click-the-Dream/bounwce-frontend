"use client";

import { useState } from "react";
import FeedImageViewer from "./FeedImageViewer";
import SafeImage from "@/app/_components/SafeImage";

type FeedMediaProps = {
  images?: string[];
  className?: string;
};

export default function FeedMedia({
  images = [],
  className = "",
}: FeedMediaProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (!images.length) return null;

  const count = images.length;
  const visibleImages = images.slice(0, 4);

  return (
    <>
      <div
        className={`mt-6 overflow-hidden rounded-[14px] border border-black/5 bg-[#f2f2f2] ${className}`}
      >
        <div className={count === 1 ? "grid grid-cols-1" : "grid grid-cols-2"}>
          {visibleImages.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              className={`group relative block overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-inset ${
                count === 2 && index === 0
                  ? "border-r border-white"
                  : count === 4 && index % 2 === 0
                    ? "border-r border-white"
                    : ""
              } ${count > 2 && index > 1 ? "border-t border-white" : ""}`}
              onClick={() => setViewerIndex(index)}
              aria-label={`Open image ${index + 1} of ${count}`}
            >
              <SafeImage
                src={src}
                alt=""
                width={600}
                height={600}
                className={`block w-full object-cover transition duration-200 group-hover:scale-[1.01] ${
                  count === 1
                    ? "max-h-127.5"
                    : "aspect-[1.05/1] sm:aspect-[1.35/1]"
                }`}
              />
              {count > 4 && index === 3 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-base font-medium text-white">
                  +{count - 4}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <FeedImageViewer
        images={images}
        startIndex={viewerIndex ?? 0}
        open={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
      />
    </>
  );
}
