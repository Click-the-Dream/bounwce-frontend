"use client";
import { useState } from "react";
import { FiX, FiArrowUp } from "react-icons/fi";
import { Plus, ZoomIn, Download, X } from "lucide-react";
import Image from "next/image";
import ViewerNav from "./ViewerNav";

interface MediaUploadModalProps {
  images: string[];
  message: string;
  setMessage: (val: string) => void;
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  onSend: () => void;
  onAddMore: () => void;
  user?: {
    id: string;
    type: string;
    initials: string;
    name: string;
    timestamp: Date;
  };
}

const MediaUploadModal = ({
  images,
  message,
  setMessage,
  setImages,
  onSend,
  onAddMore,
  user,
}: MediaUploadModalProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const removeImage = async (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    await setImages(updated);
    if (activeIndex >= updated.length) {
      console.log(activeIndex, updated.length);

      setActiveIndex(Math.max(0, updated.length - 1));
    }
  };

  if (images.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-white flex flex-col z-100 justify-between gap-2">
      {/* HEADER */}
      <ViewerNav user={user} display={""} handleClose={() => setImages([])} />

      {/* MAIN VIEWPORT */}
      <div className="flex-1 w-full h-full flex my-2 items-center justify-center overflow-hidden">
        <Image
          src={images[activeIndex]}
          alt="preview"
          width={1200}
          height={800}
          priority
          className="h-full w-auto object-contain"
        />
      </div>

      <div className="flex h-10.75 items-center justify-center overflow-hidden my-3">
        {/* CAPTION INPUT - Matches screenshot colors/style */}
        <div className="w-full max-w-3xl relative px-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a Message"
            className="w-full py-4 px-6 pr-14 rounded-[10px] bg-[#EFF3F4] border-none focus:outline-none text-sm placeholder:text-[#9C9C9C]"
            onKeyDown={(e) => e.key === "Enter" && onSend()}
          />
          <button
            onClick={onSend}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-7.75 h-7.5 bg-orange rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-all"
          >
            <FiArrowUp size={18} strokeWidth={1} />
          </button>
        </div>
      </div>

      {/* THUMBNAIL TRAY - Styled exactly like the image */}
      <div className="bg-white flex items-center gap-1 p-1.75 border-t-[0.53px] border-[#00000033] overflow-x-auto">
        {images.map((img, i) => (
          <div
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`shrink-0 relative w-17 h-15 cursor-pointer transition-all border ${
              i === activeIndex
                ? "border-orange border-2"
                : "border-transparent"
            }`}
          >
            <img src={img} className="w-full h-full object-cover" alt="thumb" />
            {images.length > 1 && (
              <div className="absolute inset-0 bg-black/5 hover:bg-transparent transition-colors" />
            )}
            <button
              onClick={() => removeImage(i)}
              className="cursor-pointer absolute top-0 right-0 bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}

        {/* The "+" Button from the image */}
        <button
          onClick={onAddMore}
          className="shrink-0 w-17 h-15 border-[0.83px] border-[#00000033] flex items-center justify-center hover:bg-gray-50 transition-all ml-1"
        >
          <Plus size={18} className="text-black" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default MediaUploadModal;
