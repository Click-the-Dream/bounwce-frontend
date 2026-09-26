"use client";

import React from "react";

type FeedAvatarProps = {
  name: string;
  src?: string;
  size?: number;
  className?: string;
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "BU";

export default function FeedAvatar({
  name,
  src,
  size = 44,
  className = "",
}: FeedAvatarProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-[15px] border border-white bg-slate-100 ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow:
          "0px 0px 2.03px 0.51px #00000040, 0.51px -3.05px 2.03px 1.52px #00000040 inset",
      }}
      aria-hidden="true"
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#f1f1f1] text-[12px] font-semibold text-[#6a6a6a]">
          {initials(name)}
        </div>
      )}
    </div>
  );
}
