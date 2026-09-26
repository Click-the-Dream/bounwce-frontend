"use client";

import {
  Ban,
  Flag,
  Link2,
  MoreHorizontal,
  Slash,
  UserMinus,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { PostMenuAction } from "./types";

type PostMenuProps = {
  handle: string;
  targetLabel?: "post" | "comment";
  open: boolean;
  align?: "left" | "right";
  onAction: (action: PostMenuAction) => void;
  onClose: () => void;
};

const items: {
  action: PostMenuAction;
  label: (handle: string) => string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  danger?: boolean;
  dividerBefore?: boolean;
}[] = [
  {
    action: "unfollow",
    label: (handle) => `Unfollow @${handle}`,
    icon: UserMinus,
  },
  {
    action: "not-interested",
    label: () => "Not interest in this post",
    icon: Slash,
  },
  {
    action: "copy-link",
    label: () => "Copy link to post",
    icon: Link2,
    dividerBefore: true,
  },
  {
    action: "mute",
    label: (handle) => `Mute @${handle}`,
    icon: VolumeX,
  },
  {
    action: "block",
    label: (handle) => `Block @${handle}`,
    icon: Ban,
    danger: true,
    dividerBefore: true,
  },
  {
    action: "report",
    label: () => "Report post",
    icon: Flag,
    danger: true,
  },
];

export default function PostMenu({
  handle,
  targetLabel = "post",
  open,
  align = "right",
  onAction,
  onClose,
}: PostMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className={`absolute top-10 z-40 w-[min(220px,calc(100vw-28px))] overflow-hidden rounded-[18px] border border-black/15 bg-white p-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.25),0_3px_10px_rgba(0,0,0,0.12)] ${
        align === "left" ? "left-0" : "right-0"
      }`}
      role="menu"
      aria-label={`${targetLabel} actions`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const label = item.action === "copy-link"
          ? `Copy link to ${targetLabel}`
          : item.action === "report"
            ? `Report ${targetLabel}`
            : item.label(handle);

        return (
          <div key={item.action}>
            {item.dividerBefore && (
              <div className="my-1.5 border-t border-[#dedede]" />
            )}

            <button
              type="button"
              role="menuitem"
              className={`flex w-full items-center gap-4 rounded-xl px-3 py-2 text-left text-xs leading-none transition hover:bg-black/[0.035] focus:outline-none focus:ring-2 focus:ring-orange/20 ${
                item.danger ? "text-orange" : "text-[#151515]"
              }`}
              onClick={() => onAction(item.action)}
            >
              <Icon
                className="h-3 w-3 shrink-0 text-[#858585]"
                strokeWidth={1.6}
              />
              <span>{label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function MoreButton({
  active,
  onClick,
}: {
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full text-[#6f6f6f] transition hover:bg-black/5 hover:text-black ${
        active ? "bg-black/5 text-black" : ""
      }`}
      aria-label="More options"
    >
      <MoreHorizontal className="h-4.5 w-4.5" strokeWidth={1.8} />
    </button>
  );
}
