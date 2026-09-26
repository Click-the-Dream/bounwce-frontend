"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import CommentDetail from "../../../_components/CommentDetail";
import { CURRENT_DEMO_USER } from "../../../_components/mockFeed";
import { FeedComment, FeedUser, PostMenuAction } from "../../../_components/types";
import { useLocalFeed } from "../../../_hooks/useLocalFeed";
import { useAuth } from "@/app/context/AuthContext";

const getAuthUser = (authDetails: any): FeedUser => {
  const user = authDetails?.user;

  return {
    id: user?.id ?? CURRENT_DEMO_USER.id,
    fullName: user?.full_name ?? user?.name ?? CURRENT_DEMO_USER.fullName,
    handle: user?.username ?? user?.handle ?? CURRENT_DEMO_USER.handle,
    avatar:
      user?.profile_pic?.url ??
      user?.profile_picture?.url ??
      CURRENT_DEMO_USER.avatar,
    verified: Boolean(
      user?.verified ?? user?.is_verified ?? CURRENT_DEMO_USER.verified,
    ),
  };
};

const findComment = (
  comments: FeedComment[] | undefined,
  commentId: string,
): FeedComment | null => {
  for (const comment of comments ?? []) {
    if (comment.id === commentId) return comment;
    const nested = findComment(comment.comments, commentId);
    if (nested) return nested;
  }
  return null;
};

export default function FeedCommentPage() {
  const router = useRouter();
  const params = useParams<{ postId: string; commentId: string }>();
  const { authDetails } = useAuth();
  const currentUser = useMemo(() => getAuthUser(authDetails), [authDetails]);
  const {
    posts,
    addReply,
    toggleLikeComment,
    toggleRepostComment,
    ready,
  } = useLocalFeed();

  const postId =
    typeof params?.postId === "string"
      ? decodeURIComponent(params.postId)
      : "";
  const commentId =
    typeof params?.commentId === "string"
      ? decodeURIComponent(params.commentId)
      : "";

  const post = posts.find((item) => item.id === postId) ?? null;
  const comment = useMemo(
    () => findComment(post?.comments, commentId),
    [post, commentId],
  );

  if (!ready) {
    return (
      <main className="min-h-full bg-white">
        <div className="mx-auto max-w-3xl border-x border-[#ededed] bg-white px-6 py-12 text-center text-sm text-[#8b8b8b]">
          Loading comment…
        </div>
      </main>
    );
  }

  if (!post || !comment) {
    return (
      <main className="min-h-full bg-white">
        <div className="mx-auto max-w-3xl border-x border-[#ededed] bg-white px-6 py-16 text-center">
          <p className="text-[17px] font-medium text-[#222]">Comment not found</p>
          <p className="mt-2 text-[14px] text-[#8b8b8b]">
            This comment may have been removed from the temporary feed.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/app/feeds/${encodeURIComponent(postId)}`)}
            className="mt-6 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#f34425]"
          >
            Back to post
          </button>
        </div>
      </main>
    );
  }

  const handleShare = (targetPostId: string, targetComment: FeedComment) => {
    const url = `${window.location.origin}/app/feeds/${encodeURIComponent(
      targetPostId,
    )}/comment/${encodeURIComponent(targetComment.id)}`;

    if (navigator.share) {
      void navigator
        .share({
          title: `${targetComment.author.fullName} on Bouwnce`,
          text: targetComment.text,
          url,
        })
        .catch(() => undefined);
      return;
    }

    void navigator.clipboard.writeText(url).catch(() => undefined);
  };

  const handleMenuAction = (
    targetPostId: string,
    targetComment: FeedComment,
    action: PostMenuAction,
  ) => {
    if (action === "not-interested") {
      router.push(`/app/feeds/${encodeURIComponent(targetPostId)}`);
      return;
    }

    if (action === "copy-link") {
      handleShare(targetPostId, targetComment);
      return;
    }

    // The API-backed moderation actions will replace these local no-op hooks.
    void targetComment;
    void action;
  };

  return (
    <CommentDetail
      postId={postId}
      comment={comment}
      currentUser={currentUser}
      onClose={() => router.push(`/app/feeds/${encodeURIComponent(postId)}`)}
      onLike={toggleLikeComment}
      onRepost={toggleRepostComment}
      onShare={handleShare}
      onAddReply={addReply}
      onMenuAction={handleMenuAction}
      onOpenReply={(replyId) =>
        router.push(
          `/app/feeds/${encodeURIComponent(postId)}/comment/${encodeURIComponent(
            replyId,
          )}`,
        )
      }
    />
  );
}
