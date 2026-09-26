"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type FeedImageViewerProps = {
  images: string[];
  startIndex?: number;
  open: boolean;
  onClose: () => void;
};

export default function FeedImageViewer({
  images,
  startIndex = 0,
  open,
  onClose,
}: FeedImageViewerProps) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (!open) return;
    setIndex(Math.min(Math.max(startIndex, 0), Math.max(images.length - 1, 0)));
  }, [open, startIndex, images.length]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (images.length > 1 && event.key === "ArrowLeft") {
        setIndex((current) =>
          current === 0 ? images.length - 1 : current - 1,
        );
      }

      if (images.length > 1 && event.key === "ArrowRight") {
        setIndex((current) =>
          current === images.length - 1 ? 0 : current + 1,
        );
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, images.length, onClose]);

  if (!open || images.length === 0) return null;

  const currentImage = images[index] ?? images[0];
  const hasMultiple = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-black/75 p-4 backdrop-blur-[3px] sm:p-7"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60"
        aria-label="Close image viewer"
      >
        <X className="h-6 w-6" strokeWidth={1.7} />
      </button>

      {hasMultiple && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIndex((current) =>
              current === 0 ? images.length - 1 : current - 1,
            );
          }}
          className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60 sm:left-6"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.7} />
        </button>
      )}

      <div
        className="flex max-h-[calc(100vh-64px)] max-w-[min(96vw,1200px)] items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={currentImage}
          alt={`Image ${index + 1} of ${images.length}`}
          draggable={false}
          className="block max-h-[calc(100vh-64px)] max-w-full rounded-[10px] object-contain shadow-[0_18px_80px_rgba(0,0,0,0.45)]"
        />
      </div>

      {hasMultiple && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIndex((current) =>
              current === images.length - 1 ? 0 : current + 1,
            );
          }}
          className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60 sm:right-6"
          aria-label="Next image"
        >
          <ChevronRight className="h-6 w-6" strokeWidth={1.7} />
        </button>
      )}

      {hasMultiple && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1.5 text-xs text-white">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
