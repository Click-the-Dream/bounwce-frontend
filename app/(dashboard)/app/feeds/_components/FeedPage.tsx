"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import FeedComposer from "./FeedComposer";
import FeedPostCard from "./FeedPostCard";
import { CURRENT_DEMO_USER } from "./mockFeed";
import {
  CreateFeedPostInput,
  FeedPost,
  FeedUser,
  PostMenuAction,
} from "./types";
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

export default function FeedPage() {
  const router = useRouter();
  const { authDetails } = useAuth();
  const currentUser = useMemo(() => getAuthUser(authDetails), [authDetails]);

  const { posts, addPost, toggleLike, toggleRepost, addComment } =
    useLocalFeed();

  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([]);
  const [mutedHandles, setMutedHandles] = useState<string[]>([]);
  const [blockedHandles, setBlockedHandles] = useState<string[]>([]);
  const [quickReplyPostId, setQuickReplyPostId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const visiblePosts = useMemo(() => {
    return posts.filter((post) => {
      if (hiddenPostIds.includes(post.id)) return false;
      if (mutedHandles.includes(post.author.handle)) return false;
      if (blockedHandles.includes(post.author.handle)) return false;
      return true;
    });
  }, [posts, hiddenPostIds, mutedHandles, blockedHandles]);

  const showNotice = (message: string) => setNotice(message);

  const handleCreatePost = (input: CreateFeedPostInput) => {
    addPost(input, currentUser);
    showNotice("Post added to the temporary local feed.");
  };

  const handleShare = async (post: FeedPost) => {
    const url = `${window.location.origin}/app/feeds?post=${encodeURIComponent(post.id)}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.author.fullName} on Bouwnce`,
          text: post.text,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      showNotice("Post link copied.");
    } catch {
      showNotice("Sharing was cancelled.");
    }
  };

  const handleMenuAction = (post: FeedPost, action: PostMenuAction) => {
    setOpenMenuPostId(null);

    switch (action) {
      case "unfollow":
        showNotice(
          `Unfollowed @${post.author.handle} in this temporary build.`,
        );
        break;
      case "not-interested":
        setHiddenPostIds((current) => [...current, post.id]);
        showNotice("Post hidden from your temporary feed.");
        break;
      case "copy-link":
        void handleShare(post);
        break;
      case "mute":
        setMutedHandles((current) =>
          current.includes(post.author.handle)
            ? current
            : [...current, post.author.handle],
        );
        showNotice(`Muted @${post.author.handle} in this temporary build.`);
        break;
      case "block":
        setBlockedHandles((current) =>
          current.includes(post.author.handle)
            ? current
            : [...current, post.author.handle],
        );
        showNotice(`Blocked @${post.author.handle} in this temporary build.`);
        break;
      case "report":
        showNotice(
          "Report saved locally for now. Connect the report endpoint here.",
        );
        break;
    }
  };

  const handleAddComment = (postId: string, text: string) => {
    const value = text.trim();
    if (!value) return;

    addComment(postId, {
      id: `comment-${Date.now()}`,
      author: currentUser,
      text: value,
      createdAt: new Date().toISOString(),
      likes: 0,
    });

    setQuickReplyPostId(null);
    showNotice("Reply added to the temporary feed.");
  };

  const handleOpenPost = (postId: string) => {
    router.push(`/app/feeds/${encodeURIComponent(postId)}`);
  };

  return (
    <main className="min-h-full pb-16">
      <div className="w-full max-w-3xl bg-transparent mx-auto pt-4">
        <FeedComposer
          user={currentUser}
          onSubmit={handleCreatePost}
          onNotice={showNotice}
        />

        <div className="shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
          {visiblePosts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              menuOpen={openMenuPostId === post.id}
              onToggleMenu={() =>
                setOpenMenuPostId((current) =>
                  current === post.id ? null : post.id,
                )
              }
              onMenuAction={(action) => handleMenuAction(post, action)}
              onOpenDetail={() => handleOpenPost(post.id)}
              onReply={() =>
                setQuickReplyPostId((current) =>
                  current === post.id ? null : post.id,
                )
              }
              onQuickReplySubmit={(text) => handleAddComment(post.id, text)}
              replyUser={currentUser}
              onLike={() => toggleLike(post.id)}
              onRepost={() => toggleRepost(post.id)}
              onShare={() => void handleShare(post)}
              showQuickReply={quickReplyPostId === post.id}
            />
          ))}

          {visiblePosts.length === 0 && (
            <div className="px-8 py-16 text-center text-[#777]">
              <p className="text-[17px] font-medium text-[#222]">
                Your temporary feed is empty.
              </p>
              <p className="mt-2 text-[14px]">
                Create a post above to add something back.
              </p>
            </div>
          )}
        </div>
      </div>

      {notice && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-120 flex justify-center px-4">
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
