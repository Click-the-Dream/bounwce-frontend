"use client";

import { useEffect, useRef, useState } from "react";

import { FeedPost, FeedUser, PostMenuAction } from "./types";

import FeedActions from "./FeedActions";
import PostMenu, { MoreButton } from "./PostMenu";
import UserImage from "../../_components/UserImage";
import PostUser from "./PostUser";
import FeedMedia from "./FeedMedia";

import { formatPostTimestamp, linkifyFeedText } from "./feedUtils";

import { Repeat } from "lucide-react";

type FeedPostCardProps = {
  post: FeedPost;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onMenuAction: (action: PostMenuAction) => void;
  onOpenDetail: () => void;
  onReply: () => void;
  onQuickReplySubmit: (text: string) => void;
  replyUser: FeedUser;
  onLike: () => void;
  onRepost: () => void;
  onShare: () => void;
  showQuickReply?: boolean;
};

export default function FeedPostCard({
  post,
  menuOpen,
  onToggleMenu,
  onMenuAction,
  onOpenDetail,
  onReply,
  onQuickReplySubmit,
  replyUser,
  onLike,
  onRepost,
  onShare,
  showQuickReply,
}: FeedPostCardProps) {
  const [quickReply, setQuickReply] = useState("");

  const replyInputRef = useRef<HTMLInputElement>(null);

  // This contains BOTH the MoreButton and PostMenu.
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showQuickReply) {
      requestAnimationFrame(() => {
        replyInputRef.current?.focus();
      });
    }
  }, [showQuickReply]);

  const isHashtagOnly =
    post.text.split("\n").length === 1 && /^#\S+$/.test(post.text.trim());

  return (
    <article
      className="relative border-t-[0.53px] border-[#dfdfdf] text-[#111] hover:bg-[#FAF9F7]"
      onClick={(event) => {
        const target = event.target as HTMLElement;

        if (
          target.closest("button") ||
          target.closest("input") ||
          target.closest("textarea")
        ) {
          return;
        }

        onOpenDetail();
      }}
    >
      {post.repostedBy && (
        <div className="flex items-center gap-1 px-5 pb-0 pt-4 text-xs text-[#767676]">
          <Repeat size={14} />

          <span>{post.repostedBy.fullName} reposted</span>
        </div>
      )}

      <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-7 sm:pt-6">
        <header className="relative flex items-start gap-3.5">
          <UserImage
            user={{
              id: post.author.id,
              full_name: post.author.fullName,
              profile_pic: {
                url: post.author.avatar,
              },
            }}
            size={32}
          />

          <PostUser post={post} />

          {/* IMPORTANT: button + menu share the same container */}
          <div
            ref={menuContainerRef}
            className="relative ml-auto"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <MoreButton active={menuOpen} onClick={onToggleMenu} />

            <PostMenu
              handle={post.author.handle}
              open={menuOpen}
              onAction={onMenuAction}
              onClose={onToggleMenu}
              containerRef={menuContainerRef}
            />
          </div>
        </header>

        <div
          className={`mt-6 text-[13px] leading-none ${
            isHashtagOnly ? "text-orange text-center font-medium sm:mt-3" : ""
          }`}
        >
          {post.text.split("\n").map((line, index) => (
            <p
              key={`${post.id}-line-${index}`}
              className={index > 0 ? "mt-5" : ""}
            >
              {linkifyFeedText(line)}
            </p>
          ))}
        </div>

        <FeedMedia images={post.media} />

        <FeedActions
          replies={post.replies}
          reposts={post.reposts}
          likes={post.likes}
          liked={post.liked}
          reposted={post.reposted}
          onReply={onReply}
          onRepost={onRepost}
          onLike={onLike}
          onShare={onShare}
        />

        {showQuickReply && (
          <div
            className="mt-5 flex items-center gap-2 rounded-[10px] border border-[#dedede] bg-white px-2.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            onClick={(event) => event.stopPropagation()}
          >
            <UserImage
              user={{
                id: replyUser.id,
                full_name: replyUser.fullName,
                profile_pic: {
                  url: replyUser.avatar,
                },
              }}
              size={28}
              clickable={false}
            />

            <input
              ref={replyInputRef}
              value={quickReply}
              onChange={(event) => setQuickReply(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setQuickReply("");
                  return;
                }

                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();

                  const value = quickReply.trim();

                  if (!value) return;

                  onQuickReplySubmit(value);
                  setQuickReply("");
                }
              }}
              placeholder={`Reply to @${post.author.handle}`}
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#B5B1B1]"
            />

            <button
              type="button"
              onClick={() => {
                const value = quickReply.trim();

                if (!value) return;

                onQuickReplySubmit(value);
                setQuickReply("");
              }}
              className="rounded-full bg-black px-4 py-1.5 text-[13px] text-white transition hover:bg-[#111] disabled:cursor-not-allowed disabled:bg-[#B4B3B2]"
              disabled={!quickReply.trim()}
            >
              Reply
            </button>
          </div>
        )}

        <time
          dateTime={post.createdAt}
          className="mt-5 block text-[14px] text-[#8d8d8d] sm:hidden"
        >
          {formatPostTimestamp(post.createdAt)}
        </time>
      </div>
    </article>
  );
}
