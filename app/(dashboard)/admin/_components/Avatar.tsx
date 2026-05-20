"use client";

import { useState } from "react";
import { avatarBg } from "@/app/_utils/utility";
import SafeImage from "@/app/_components/SafeImage";

export default function Avatar({
  initials,
  src,
  size = "md",
}: {
  initials: string;
  src?: string;
  size?: "sm" | "md";
}) {
  const px = size === "sm" ? 28 : 32;
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";
  const showImage = src;

  return (
    <span
      className={`${sz} ${showImage ? "" : "bg-gray-100"} rounded-full flex items-center justify-center font-semibold shrink-0 overflow-hidden relative`}
    >
      {showImage ? (
        <SafeImage
          src={src}
          alt={initials}
          width={px}
          height={px}
          className="object-cover w-full h-full"
        />
      ) : (
        initials
      )}
    </span>
  );
}
