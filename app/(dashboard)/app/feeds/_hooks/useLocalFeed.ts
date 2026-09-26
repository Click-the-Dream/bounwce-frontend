"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CreateFeedPostInput,
  FeedComment,
  FeedPost,
} from "../_components/types";
import {
  createLocalPostId,
  normalizeStoredPosts,
} from "../_components/feedUtils";
import { DEMO_POSTS } from "../_components/mockFeed";

const STORAGE_KEY = "bouwnce.feed.demo.v1";

type CommentMutator = (
  comment: FeedComment,
) => FeedComment;

const updateCommentTree = (
  comments: FeedComment[],
  commentId: string,
  mutator: CommentMutator,
): { comments: FeedComment[]; changed: boolean } => {
  let changed = false;

  const next = comments.map((comment) => {
    if (comment.id === commentId) {
      changed = true;
      return mutator(comment);
    }

    if (!comment.comments?.length) return comment;

    const result = updateCommentTree(comment.comments, commentId, mutator);
    if (!result.changed) return comment;

    changed = true;
    return {
      ...comment,
      comments: result.comments,
    };
  });

  return { comments: next, changed };
};

const appendReplyToComment = (
  comments: FeedComment[],
  parentId: string,
  reply: FeedComment,
): { comments: FeedComment[]; changed: boolean } => {
  let changed = false;

  const next = comments.map((comment) => {
    if (comment.id === parentId) {
      changed = true;
      return {
        ...comment,
        replies: (comment.replies ?? 0) + 1,
        comments: [...(comment.comments ?? []), reply],
      };
    }

    if (!comment.comments?.length) return comment;

    const result = appendReplyToComment(comment.comments, parentId, reply);
    if (!result.changed) return comment;

    changed = true;
    return {
      ...comment,
      comments: result.comments,
    };
  });

  return { comments: next, changed };
};

export const useLocalFeed = () => {
  const [posts, setPosts] = useState<FeedPost[]>(DEMO_POSTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = normalizeStoredPosts(JSON.parse(raw));
        if (stored.length) setPosts(stored);
      }
    } catch {
      // Demo feed should remain usable even if storage is unavailable.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch {
      // Ignore storage quota/privacy errors for the temporary demo feed.
    }
  }, [posts, ready]);

  const addPost = useCallback(
    (input: CreateFeedPostInput, author: FeedPost["author"]) => {
      const newPost: FeedPost = {
        id: createLocalPostId(),
        author,
        text: input.text.trim(),
        createdAt: new Date().toISOString(),
        media: input.media,
        replies: 0,
        reposts: 0,
        likes: 0,
        comments: [],
      };

      setPosts((current) => [newPost, ...current]);
      return newPost;
    },
    [],
  );

  const toggleLike = useCallback((postId: string) => {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) return post;
        const nextLiked = !post.liked;
        return {
          ...post,
          liked: nextLiked,
          likes: Math.max(0, post.likes + (nextLiked ? 1 : -1)),
        };
      }),
    );
  }, []);

  const toggleRepost = useCallback((postId: string) => {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) return post;
        const nextReposted = !post.reposted;
        return {
          ...post,
          reposted: nextReposted,
          reposts: Math.max(0, post.reposts + (nextReposted ? 1 : -1)),
        };
      }),
    );
  }, []);

  const addComment = useCallback((postId: string, comment: FeedComment) => {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          replies: post.replies + 1,
          comments: [...(post.comments ?? []), comment],
        };
      }),
    );
  }, []);

  const addReply = useCallback(
    (postId: string, parentCommentId: string, reply: FeedComment) => {
      setPosts((current) =>
        current.map((post) => {
          if (post.id !== postId) return post;
          if (!post.comments?.length) return post;

          const result = appendReplyToComment(
            post.comments,
            parentCommentId,
            reply,
          );

          return result.changed
            ? {
                ...post,
                replies: post.replies + 1,
                comments: result.comments,
              }
            : post;
        }),
      );
    },
    [],
  );

  const toggleLikeComment = useCallback(
    (postId: string, commentId: string) => {
      setPosts((current) =>
        current.map((post) => {
          if (post.id !== postId || !post.comments?.length) return post;

          const result = updateCommentTree(
            post.comments,
            commentId,
            (comment) => {
              const nextLiked = !comment.liked;
              return {
                ...comment,
                liked: nextLiked,
                likes: Math.max(
                  0,
                  comment.likes + (nextLiked ? 1 : -1),
                ),
              };
            },
          );

          return result.changed ? { ...post, comments: result.comments } : post;
        }),
      );
    },
    [],
  );

  const toggleRepostComment = useCallback(
    (postId: string, commentId: string) => {
      setPosts((current) =>
        current.map((post) => {
          if (post.id !== postId || !post.comments?.length) return post;

          const result = updateCommentTree(
            post.comments,
            commentId,
            (comment) => {
              const nextReposted = !comment.reposted;
              return {
                ...comment,
                reposted: nextReposted,
                reposts: Math.max(
                  0,
                  (comment.reposts ?? 0) + (nextReposted ? 1 : -1),
                ),
              };
            },
          );

          return result.changed ? { ...post, comments: result.comments } : post;
        }),
      );
    },
    [],
  );

  const replacePost = useCallback((updated: FeedPost) => {
    setPosts((current) =>
      current.map((post) => (post.id === updated.id ? updated : post)),
    );
  }, []);

  return useMemo(
    () => ({
      posts,
      addPost,
      toggleLike,
      toggleRepost,
      addComment,
      addReply,
      toggleLikeComment,
      toggleRepostComment,
      replacePost,
      ready,
    }),
    [
      posts,
      addPost,
      toggleLike,
      toggleRepost,
      addComment,
      addReply,
      toggleLikeComment,
      toggleRepostComment,
      replacePost,
      ready,
    ],
  );
};
