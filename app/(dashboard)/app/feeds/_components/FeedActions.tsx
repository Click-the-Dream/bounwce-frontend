"use client";

import { Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";

type FeedActionsProps = {
  replies: number;
  reposts: number;
  likes: number;
  liked?: boolean;
  reposted?: boolean;
  onReply: () => void;
  onRepost: () => void;
  onLike: () => void;
  onShare: () => void;
};

const countLabel = (count: number) => count.toLocaleString("en-US");

export default function FeedActions({
  replies,
  reposts,
  likes,
  liked,
  reposted,
  onReply,
  onRepost,
  onLike,
  onShare,
}: FeedActionsProps) {
  return (
    <div className="flex items-center gap-7 px-0 pt-5 text-[#535353]">
      <button
        type="button"
        onClick={onReply}
        className="group inline-flex min-h-10 items-center gap-1 rounded-lg text-xs transition hover:text-[#111]"
        aria-label={`${replies} replies`}
      >
        <MessageCircle
          className="h-4 w-4 transition group-hover:scale-105"
          strokeWidth={1.6}
        />
        <span>{countLabel(replies)}</span>
      </button>

      <button
        type="button"
        onClick={onRepost}
        className={`group inline-flex min-h-10 items-center gap-1 rounded-lg text-xs transition ${
          reposted ? "text-[#111]" : "hover:text-[#111]"
        }`}
        aria-pressed={reposted}
        aria-label={`${reposts} reposts`}
      >
        <Repeat2
          className={`h-4 w-4 transition group-hover:scale-105 ${
            reposted ? "text-[#111]" : ""
          }`}
          strokeWidth={1.6}
        />
        <span>{countLabel(reposts)}</span>
      </button>

      <button
        type="button"
        onClick={onLike}
        className={`group inline-flex min-h-10 items-center gap-1 rounded-lg text-xs transition ${
          liked ? "text-orange" : "hover:text-[#111]"
        }`}
        aria-pressed={liked}
        aria-label={`${likes} likes`}
      >
        <Heart
          className={`h-4 w-4 transition group-hover:scale-105 ${
            liked ? "fill-current" : ""
          }`}
          strokeWidth={1.6}
        />
        <span>{countLabel(likes)}</span>
      </button>

      <button
        type="button"
        onClick={onShare}
        className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-[#656565] transition hover:bg-black/5 hover:text-[#111]"
        aria-label="Share post"
      >
        <Share2 className="h-4.25 w-4.25" strokeWidth={1.6} />
      </button>
    </div>
  );
}
