import { useState } from "react";
import Image from "next/image";
// You can import an icon from lucide-react if you want a nice fallback visual
import { ImageOff } from "lucide-react";

const SafeImage = ({
  src,
  alt,
  width,
  height,
  className,
  style,
  showLoader = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  style?: any;
  showLoader?: boolean;
}) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // If the image fails to load entirely, show a fallback UI
  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 rounded-[10px] ${className ?? ""}`}
        style={style}
      >
        <ImageOff className="size-4 mb-1" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Shimmer placeholder — only shown when showLoader and not yet loaded */}
      {showLoader && !loaded && (
        <div
          className="absolute inset-0 rounded-[10px] overflow-hidden"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[#d0d0d0] dark:bg-[#3a3a3a]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
              animation: "wa-shimmer 1.4s infinite linear",
            }}
          />
          <style>{`
            @keyframes wa-shimmer {
              0%   { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      )}

      <Image
        src={src}
        alt={alt || "image"}
        width={width}
        height={height}
        unoptimized
        className={`${className ?? ""} transition-all duration-300 ${
          showLoader && !loaded
            ? "opacity-0 scale-[1.02] blur-sm"
            : "opacity-100 scale-100 blur-0"
        }`}
        style={style}
        onLoad={() => setLoaded(true)}
        onError={() => {
          // Triggers if the connection resets, 404s, or the file is corrupted
          setHasError(true);
          setLoaded(true); // Ensures the shimmer turns off
        }}
      />
    </div>
  );
};

export default SafeImage;
