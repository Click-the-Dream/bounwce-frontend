"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import PostDetail from "../_components/PostDetail";
import { CURRENT_DEMO_USER } from "../_components/mockFeed";
import { FeedComment, FeedPost, FeedUser, PostMenuAction } from "../_components/types";
import { useLocalFeed } from "../_hooks/useLocalFeed";
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

export default function FeedPostPage() {
  const router = useRouter();
  const params = useParams<{ postId: string }>();
  const { authDetails } = useAuth();
  const currentUser = useMemo(() => getAuthUser(authDetails), [authDetails]);
  const {
    posts,
    toggleLike,
    toggleRepost,
    addComment,
    toggleLikeComment,
    toggleRepostComment,
    ready,
  } = useLocalFeed();

  const postId =
    typeof params?.postId === "string" ? decodeURIComponent(params.postId) : "";
  const post = posts.find((item) => item.id === postId) ?? null;

  if (!ready) {
    return (
      <main className="min-h-full bg-white">
        <div className="mx-auto max-w-3xl border-x border-[#ededed] bg-white px-6 py-12 text-center text-sm text-[#8b8b8b]">
          Loading post…
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-full bg-white">
        <div className="mx-auto max-w-3xl border-x border-[#ededed] bg-white px-6 py-16 text-center">
          <p className="text-[17px] font-medium text-[#222]">Post not found</p>
          <p className="mt-2 text-[14px] text-[#8b8b8b]">
            This post may have been removed from the temporary feed.
          </p>
          <button
            type="button"
            onClick={() => router.push("/app/feeds")}
            className="mt-6 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#f34425]"
          >
            Back to feed
          </button>
        </div>
      </main>
    );
  }

  const handleShare = (targetPost: FeedPost) => {
    const url = `${window.location.origin}/app/feeds/${encodeURIComponent(
      targetPost.id,
    )}`;

    if (navigator.share) {
      void navigator
        .share({
          title: `${targetPost.author.fullName} on Bouwnce`,
          text: targetPost.text,
          url,
        })
        .catch(() => undefined);
      return;
    }

    void navigator.clipboard.writeText(url).catch(() => undefined);
  };

  const handleShareComment = (
    targetPostId: string,
    comment: FeedComment,
  ) => {
    const url = `${window.location.origin}/app/feeds/${encodeURIComponent(
      targetPostId,
    )}/comment/${encodeURIComponent(comment.id)}`;

    if (navigator.share) {
      void navigator
        .share({
          title: `${comment.author.fullName} on Bouwnce`,
          text: comment.text,
          url,
        })
        .catch(() => undefined);
      return;
    }

    void navigator.clipboard.writeText(url).catch(() => undefined);
  };

  const handleMenuAction = (targetPost: FeedPost, action: PostMenuAction) => {
    if (action === "not-interested") {
      router.push("/app/feeds");
      return;
    }

    if (action === "copy-link") {
      handleShare(targetPost);
      return;
    }

    // Connect moderation/account actions to the API when available.
    void targetPost;
    void action;
  };

  const handleCommentMenuAction = (
    targetPostId: string,
    comment: FeedComment,
    action: PostMenuAction,
  ) => {
    if (action === "not-interested") {
      router.push(`/app/feeds/${encodeURIComponent(targetPostId)}`);
      return;
    }

    if (action === "copy-link") {
      handleShareComment(targetPostId, comment);
      return;
    }

    // Connect moderation/account actions to the API when available.
    void comment;
    void action;
  };

  return (
    <PostDetail
      post={post}
      currentUser={currentUser}
      onClose={() => router.push("/app/feeds")}
      onLike={toggleLike}
      onRepost={toggleRepost}
      onShare={handleShare}
      onMenuAction={handleMenuAction}
      onAddComment={addComment}
      onLikeComment={toggleLikeComment}
      onRepostComment={toggleRepostComment}
      onShareComment={handleShareComment}
      onCommentMenuAction={handleCommentMenuAction}
      onOpenComment={(commentId) =>
        router.push(
          `/app/feeds/${encodeURIComponent(post.id)}/comment/${encodeURIComponent(
            commentId,
          )}`,
        )
      }
    />
  );
}
