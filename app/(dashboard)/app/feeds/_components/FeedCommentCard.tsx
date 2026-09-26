"use client";

import { useState } from "react";
import { FeedComment, PostMenuAction } from "./types";
import FeedActions from "./FeedActions";
import FeedMedia from "./FeedMedia";
import PostMenu, { MoreButton } from "./PostMenu";
import PostUser from "./PostUser";
import UserImage from "../../_components/UserImage";

type FeedCommentCardProps = {
  comment: FeedComment;
  onOpen: () => void;
  onLike: () => void;
  onRepost: () => void;
  onReply: () => void;
  onShare: () => void;
  onMenuAction?: (action: PostMenuAction) => void;
};

export default function FeedCommentCard({
  comment,
  onOpen,
  onLike,
  onRepost,
  onReply,
  onShare,
  onMenuAction,
}: FeedCommentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuAction = (action: PostMenuAction) => {
    setMenuOpen(false);
    onMenuAction?.(action);
  };

  return (
    <article
      className="relative cursor-pointer border-b border-[#dfdfdf] px-5 py-6 transition hover:bg-[#FAF9F7] sm:px-7"
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (
          target.closest("button") ||
          target.closest("input") ||
          target.closest("textarea")
        ) {
          return;
        }
        onOpen();
      }}
    >
      <div className="flex items-start gap-4">
        <UserImage
          user={{
            id: comment.author.id,
            full_name: comment.author.fullName,
            profile_pic: {
              url: comment.author.avatar,
            },
          }}
          size={32}
          rounded="rounded-[10px] bg-gray-100 border-[#d6d6d6]"
          clickable={false}
        />

        <div className="relative min-w-0 flex-1">
          <PostUser post={comment} />

          <p className="mt-4 whitespace-pre-line text-[14px] leading-7 text-[#666]">
            {comment.text}
          </p>

          <FeedMedia images={comment.media} />

          <FeedActions
            replies={comment.replies ?? comment.comments?.length ?? 0}
            reposts={comment.reposts ?? 0}
            likes={comment.likes ?? 0}
            liked={comment.liked}
            reposted={comment.reposted}
            onReply={onReply}
            onRepost={onRepost}
            onLike={onLike}
            onShare={onShare}
          />
        </div>

        <div className="relative shrink-0">
          <MoreButton
            active={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          />
          {onMenuAction && (
            <PostMenu
              handle={comment.author.handle}
              targetLabel="comment"
              open={menuOpen}
              onAction={handleMenuAction}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>
    </article>
  );
}
