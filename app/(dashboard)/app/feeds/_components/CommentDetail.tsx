"use client";

import { useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { FeedComment, FeedUser, PostMenuAction } from "./types";
import FeedActions from "./FeedActions";
import FeedCommentCard from "./FeedCommentCard";
import FeedMedia from "./FeedMedia";
import PostMenu, { MoreButton } from "./PostMenu";
import { formatPostTimestamp, linkifyFeedText } from "./feedUtils";
import UserImage from "../../_components/UserImage";
import PostUser from "./PostUser";

type CommentDetailProps = {
  postId: string;
  comment: FeedComment | null;
  currentUser: FeedUser;
  onClose: () => void;
  onLike: (postId: string, commentId: string) => void;
  onRepost: (postId: string, commentId: string) => void;
  onShare: (postId: string, comment: FeedComment) => void;
  onAddReply: (
    postId: string,
    parentCommentId: string,
    reply: FeedComment,
  ) => void;
  onMenuAction?: (
    postId: string,
    comment: FeedComment,
    action: PostMenuAction,
  ) => void;
  onOpenReply: (commentId: string) => void;
};

export default function CommentDetail({
  postId,
  comment,
  currentUser,
  onClose,
  onLike,
  onRepost,
  onShare,
  onAddReply,
  onMenuAction,
  onOpenReply,
}: CommentDetailProps) {
  const [replyText, setReplyText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!comment) return null;

  const childReplies = comment.comments ?? [];

  const submitReply = () => {
    const value = replyText.trim();
    if (!value) return;

    onAddReply(postId, comment.id, {
      id: `comment-${Date.now()}`,
      author: currentUser,
      text: value,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: 0,
      reposts: 0,
      liked: false,
      reposted: false,
      comments: [],
    });

    setReplyText("");
  };

  const handleMenuAction = (action: PostMenuAction) => {
    setMenuOpen(false);

    if (action === "not-interested") {
      onClose();
      return;
    }

    if (onMenuAction) {
      onMenuAction(postId, comment, action);
      return;
    }

    if (action === "copy-link") {
      const url = `${window.location.origin}/app/feeds/${encodeURIComponent(postId)}/comment/${encodeURIComponent(comment.id)}`;
      void navigator.clipboard.writeText(url).then(
        () => setNotice("Comment link copied."),
        () => setNotice("Could not copy the comment link."),
      );
      return;
    }

    setNotice(
      action === "report"
        ? "Report saved locally for now."
        : "Action saved locally for this temporary feed.",
    );
  };

  return (
    <main className="min-h-full bg-white pb-16">
      <div className="mx-auto w-full max-w-3xl border-x border-[#ededed] bg-white">
        <div className="sticky top-0 z-20 flex h-14 items-center border-b border-[#dfdfdf] bg-white/95 px-4 backdrop-blur sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#222] transition hover:bg-black/5"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <span className="ml-1 text-[13px] text-black">Comment</span>
        </div>

        <section className="border-b border-[#dfdfdf] px-5 pb-5 pt-6 sm:px-7">
          <header className="relative flex items-start gap-4">
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

            <PostUser post={comment} />

            <MoreButton
              active={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            />
            <PostMenu
              handle={comment.author.handle}
              targetLabel="comment"
              open={menuOpen}
              onAction={handleMenuAction}
              onClose={() => setMenuOpen(false)}
            />
          </header>

          <div className="mt-4 text-[13px] leading-7">
            {comment.text.split("\n").map((line, index) => (
              <p key={`${comment.id}-detail-${index}`}>
                {linkifyFeedText(line)}
              </p>
            ))}
          </div>

          <FeedMedia images={comment.media} />

          <time
            className="mt-4 block border-b-[0.53px] border-[#00000033] pb-4 text-xs text-[#535353]"
            dateTime={comment.createdAt}
          >
            {formatPostTimestamp(comment.createdAt)}
          </time>

          <FeedActions
            replies={comment.replies ?? childReplies.length}
            reposts={comment.reposts ?? 0}
            likes={comment.likes}
            liked={comment.liked}
            reposted={comment.reposted}
            onReply={() =>
              document.getElementById("feed-comment-detail-reply")?.focus()
            }
            onRepost={() => onRepost(postId, comment.id)}
            onLike={() => onLike(postId, comment.id)}
            onShare={() => onShare(postId, comment)}
          />
        </section>

        <section className="border-b border-[#dfdfdf] px-5 py-4">
          <div className="flex items-start gap-4">
            <UserImage
              user={{
                id: currentUser.id,
                full_name: currentUser.fullName,
                profile_pic: {
                  url: currentUser.avatar,
                },
              }}
              size={32}
              rounded="rounded-[10px] bg-gray-100 border-[#d6d6d6]"
              clickable={false}
            />

            <div className="min-w-0 flex-1">
              <textarea
                id="feed-comment-detail-reply"
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    (event.metaKey || event.ctrlKey) &&
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    submitReply();
                  }
                }}
                placeholder={`Reply to @${comment.author.handle}.........`}
                rows={2}
                className="min-h-5 w-full resize-none bg-transparent pt-1 text-[13px] leading-6 outline-none placeholder:text-[#b6b6b6]"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={submitReply}
                  disabled={!replyText.trim()}
                  className="rounded-full bg-black px-4 py-1.5 text-[13px] text-white transition disabled:cursor-not-allowed disabled:bg-[#B4B3B2]"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        </section>

        {childReplies.length > 0 && (
          <div className="border-b border-[#dfdfdf] px-5 py-4 text-[12px] font-medium uppercase tracking-[0.12em] text-[#8b8b8b] sm:px-7">
            Replies
          </div>
        )}

        {childReplies.map((reply) => (
          <FeedCommentCard
            key={reply.id}
            comment={reply}
            onOpen={() => onOpenReply(reply.id)}
            onLike={() => onLike(postId, reply.id)}
            onRepost={() => onRepost(postId, reply.id)}
            onReply={() => onOpenReply(reply.id)}
            onShare={() => onShare(postId, reply)}
            onMenuAction={(action) => onMenuAction?.(postId, reply, action)}
          />
        ))}

        {!childReplies.length && (
          <div className="px-7 py-10 text-center text-[13px] text-[#8b8b8b]">
            No replies yet. Start the conversation.
          </div>
        )}
      </div>

      {notice && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-170 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-[#111] px-4 py-3 text-[14px] font-medium text-white shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange">
              <Check className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
