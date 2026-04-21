"use client";

import Image from "next/image";
import { useState } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import ViewerNav from "./ViewerNav";

const ImageViewer = ({ media, startIndex, onClose, user }: any) => {
  const [index, setIndex] = useState(startIndex);

  const current = media[index];

  if (!current) return null; // 🛡 safety guard

  return (
    <div className="fixed inset-0 bg-white flex flex-col z-50">
      {/* HEADER */}
      <ViewerNav user={user} display={current} handleClose={onClose} />

      {/* VIEWPORT */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* LEFT */}
        <button
          onClick={() => setIndex((i: number) => Math.max(i - 1, 0))}
          className="cursor-pointer absolute left-6 z-10 w-11 h-11 rounded-full bg-orange text-white flex items-center justify-center shadow-md"
        >
          <MdKeyboardArrowLeft />
        </button>

        {/* IMAGE */}
        <div className="p-10 w-full h-full flex items-center justify-center">
          <Image
            src={current.src}
            alt="media"
            width={1200}
            height={800}
            priority
            className="max-h-full w-auto object-contain"
          />
        </div>

        {/* RIGHT */}
        <button
          onClick={() =>
            setIndex((i: number) => Math.min(i + 1, media.length - 1))
          }
          className="cursor-pointer absolute right-6 z-10 w-11 h-11 rounded-full bg-orange text-white flex items-center justify-center shadow-md"
        >
          <MdKeyboardArrowRight />
        </button>
      </div>

      {/* THUMBNAILS */}
      <div className="h-21.25 bg-white flex items-center gap-3 px-6 overflow-x-auto border-t border-[#00000033]">
        {media.map((m: any, i: number) => (
          <div
            key={i}
            onClick={() => setIndex(i)}
            className={`min-w-19.75 h-18 overflow-hidden cursor-pointer border-2 transition-all ${
              i === index
                ? "border-orange scale-110 shadow-sm"
                : "border-transparent opacity-50"
            }`}
          >
            <img
              src={m.src}
              className="w-full h-full object-cover"
              alt="thumb"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageViewer;
