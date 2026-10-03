"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import FeedComposer from "./FeedComposer";
import { CreateFeedPostInput, FeedUser } from "./types";

type CreatePostModalProps = {
  open: boolean;
  user: FeedUser;
  onClose: () => void;
  onSubmit: (input: CreateFeedPostInput) => void;
  onNotice?: (message: string) => void;
};

export default function CreatePostModal({
  open,
  user,
  onClose,
  onSubmit,
  onNotice,
}: CreatePostModalProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-110 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        className="relative w-full max-w-160 overflow-hidden rounded-[15px] bg-black text-white shadow-[0_30px_90px_rgba(0,0,0,0.4)]"
        role="dialog"
        aria-modal="true"
        aria-label="Create a new post"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Close new post"
        >
          <X className="h-5 w-5" strokeWidth={1.7} />
        </button>

        <div className="px-2 sm:px-7">
          <FeedComposer
            user={user}
            autoFocus
            onSubmit={(input) => {
              onSubmit(input);
              onClose();
            }}
            onNotice={onNotice}
          />
        </div>
      </div>
    </div>
  );
}
