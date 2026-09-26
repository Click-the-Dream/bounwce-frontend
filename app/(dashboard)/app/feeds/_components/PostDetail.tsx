"use client";

import { useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";

import { FeedComment, FeedPost, FeedUser, PostMenuAction } from "./types";
import FeedActions from "./FeedActions";
import FeedCommentCard from "./FeedCommentCard";
import FeedMedia from "./FeedMedia";
import PostMenu, { MoreButton } from "./PostMenu";
import { formatPostTimestamp, linkifyFeedText } from "./feedUtils";
import UserImage from "../../_components/UserImage";
import PostUser from "./PostUser";

type PostDetailProps = {
  post: FeedPost | null;
  currentUser: FeedUser;
  onClose: () => void;

  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onShare: (post: FeedPost) => void;
  onMenuAction?: (post: FeedPost, action: PostMenuAction) => void;

  onAddComment: (postId: string, comment: FeedComment) => void;
  onLikeComment?: (postId: string, commentId: string) => void;
  onRepostComment?: (postId: string, commentId: string) => void;
  onReplyToComment?: (postId: string, commentId: string) => void;
  onShareComment?: (postId: string, comment: FeedComment) => void;
  onCommentMenuAction?: (postId: string, comment: FeedComment, action: PostMenuAction) => void;
  onOpenComment: (commentId: string) => void;
};

export default function PostDetail({
  post,
  currentUser,
  onClose,
  onLike,
  onRepost,
  onShare,
  onMenuAction,
  onAddComment,
  onLikeComment,
  onRepostComment,
  onReplyToComment,
  onShareComment,
  onCommentMenuAction,
  onOpenComment,
}: PostDetailProps) {
  const [comment, setComment] = useState("");
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!post) return null;

  const comments = post.comments ?? [];

  const handleSubmit = () => {
    const value = comment.trim();
    if (!value) return;

    onAddComment(post.id, {
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
    setComment("");
  };

  const handleLocalMenu = (action: PostMenuAction) => {
    setPostMenuOpen(false);

    if (action === "not-interested") {
      onClose();
      return;
    }

    if (onMenuAction) {
      onMenuAction(post, action);
      return;
    }

    if (action === "copy-link") {
      const url = `${window.location.origin}/app/feeds/${encodeURIComponent(post.id)}`;
      void navigator.clipboard.writeText(url).then(
        () => setNotice("Post link copied."),
        () => setNotice("Could not copy the post link."),
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
            className="rounded-full p-1.5 text-[14px] font-medium text-[#222] transition hover:bg-black/5"
            aria-label="Back to feed"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <span className="ml-1 text-[13px] text-black">Post</span>
        </div>

        <section className="border-b border-[#dfdfdf] px-5 pb-5 pt-6 sm:px-7">
          <header className="relative flex items-start gap-4">
            <UserImage
              user={{
                id: post.author.id,
                full_name: post.author.fullName,
                profile_pic: {
                  url: post.author.avatar,
                },
              }}
              size={32}
              rounded="rounded-[10px] bg-gray-100 border-[#d6d6d6]"
              clickable={false}
            />

            <PostUser post={post} />

            <MoreButton
              active={postMenuOpen}
              onClick={() => setPostMenuOpen((current) => !current)}
            />
            <PostMenu
              handle={post.author.handle}
              open={postMenuOpen}
              onAction={handleLocalMenu}
              onClose={() => setPostMenuOpen(false)}
            />
          </header>

          <div className="mt-4 text-[13px] leading-7">
            {post.text.split("\n").map((line, index) => (
              <p key={`${post.id}-detail-${index}`}>
                {linkifyFeedText(line)}
              </p>
            ))}
          </div>

          <FeedMedia images={post.media} />

          <time
            className="mt-4 block border-b-[0.53px] border-[#00000033] pb-4 text-xs text-[#535353]"
            dateTime={post.createdAt}
          >
            {formatPostTimestamp(post.createdAt)}
          </time>

          <FeedActions
            replies={post.replies}
            reposts={post.reposts}
            likes={post.likes}
            liked={post.liked}
            reposted={post.reposted}
            onReply={() =>
              document.getElementById("feed-detail-comment")?.focus()
            }
            onRepost={() => onRepost(post.id)}
            onLike={() => onLike(post.id)}
            onShare={() => onShare(post)}
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
                id="feed-detail-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    (event.metaKey || event.ctrlKey) &&
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Add Comment........."
                rows={2}
                className="min-h-5 w-full resize-none bg-transparent pt-1 text-[13px] leading-6 outline-none placeholder:text-[#b6b6b6]"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!comment.trim()}
                  className="rounded-full bg-black px-4 py-1.5 text-[13px] text-white transition disabled:cursor-not-allowed disabled:bg-[#B4B3B2]"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        </section>

        {comments.length > 0 && (
          <div className="border-b border-[#dfdfdf] px-5 py-4 text-[12px] font-medium uppercase tracking-[0.12em] text-[#8b8b8b] sm:px-7">
            Replies
          </div>
        )}

        {comments.map((commentItem) => (
          <FeedCommentCard
            key={commentItem.id}
            comment={commentItem}
            onOpen={() => onOpenComment(commentItem.id)}
            onLike={() => onLikeComment?.(post.id, commentItem.id)}
            onRepost={() => onRepostComment?.(post.id, commentItem.id)}
            onReply={() => onOpenComment(commentItem.id)}
            onShare={() => onShareComment?.(post.id, commentItem)}
            onMenuAction={(action) =>
              onCommentMenuAction?.(post.id, commentItem, action)
            }
          />
        ))}

        {!comments.length && (
          <div className="px-7 py-10 text-center text-[15px] text-[#8b8b8b]">
            No replies yet. Start the conversation.
          </div>
        )}
      </div>

      {notice && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[170] flex justify-center px-4">
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
