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

import {
  isLocalMedia,
  isIndexedDbMediaRef,
  storeLocalMedia,
} from "@/app/_utils/feedMediaStorage";

const STORAGE_KEY = "bouwnce.feed.demo.v1";

type CommentMutator = (comment: FeedComment) => FeedComment;

const updateCommentTree = (
  comments: FeedComment[],
  commentId: string,
  mutator: CommentMutator,
): {
  comments: FeedComment[];
  changed: boolean;
} => {
  let changed = false;

  const next = comments.map((comment) => {
    if (comment.id === commentId) {
      changed = true;

      return mutator(comment);
    }

    if (!comment.comments?.length) {
      return comment;
    }

    const result = updateCommentTree(comment.comments, commentId, mutator);

    if (!result.changed) {
      return comment;
    }

    changed = true;

    return {
      ...comment,
      comments: result.comments,
    };
  });

  return {
    comments: next,
    changed,
  };
};

const appendReplyToComment = (
  comments: FeedComment[],
  parentId: string,
  reply: FeedComment,
): {
  comments: FeedComment[];
  changed: boolean;
} => {
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

    if (!comment.comments?.length) {
      return comment;
    }

    const result = appendReplyToComment(comment.comments, parentId, reply);

    if (!result.changed) {
      return comment;
    }

    changed = true;

    return {
      ...comment,
      comments: result.comments,
    };
  });

  return {
    comments: next,
    changed,
  };
};

const migratePostMedia = async (post: FeedPost): Promise<FeedPost> => {
  if (!post.media?.length) {
    return post;
  }

  let changed = false;

  const media = await Promise.all(
    post.media.map(async (src) => {
      if (!isLocalMedia(src)) {
        return src;
      }

      try {
        const storedRef = await storeLocalMedia(src);

        changed = true;

        return storedRef;
      } catch (error) {
        console.error("Failed to move local image into IndexedDB:", error);

        return src;
      }
    }),
  );

  if (!changed) {
    return post;
  }

  return {
    ...post,
    media,
  };
};

/**
 * Migrate all posts loaded from storage.
 */
const migratePostsMedia = async (posts: FeedPost[]): Promise<FeedPost[]> => {
  return Promise.all(posts.map((post) => migratePostMedia(post)));
};

/**
 * Strip local data/blob URLs before writing to localStorage.
 *
 * This prevents QuotaExceededError even if an image
 * has not finished migrating yet.
 */
const serializePostsForStorage = (posts: FeedPost[]): FeedPost[] => {
  return posts.map((post) => ({
    ...post,
    media: (post.media ?? []).filter(
      (src) => !isLocalMedia(src) || isIndexedDbMediaRef(src),
    ),
  }));
};

/**
 * Safely write feed metadata.
 *
 * If the old storage value is already occupying too much
 * space, remove it and write the smaller metadata payload.
 */
const persistPosts = (posts: FeedPost[]) => {
  const safePosts = serializePostsForStorage(posts);

  const serialized = JSON.stringify(safePosts);

  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);

    return;
  } catch (error) {
    console.warn(
      "localStorage write failed. Retrying after replacing the old feed value.",
      error,
    );
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);

    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error("Failed to persist feed metadata:", error);
  }
};

export const useLocalFeed = () => {
  const [posts, setPosts] = useState<FeedPost[]>(DEMO_POSTS);

  const [ready, setReady] = useState(false);

  /**
   * Load + migrate stored posts.
   */
  useEffect(() => {
    let cancelled = false;

    const loadFeed = async () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) {
          if (!cancelled) {
            setPosts(DEMO_POSTS);
          }

          return;
        }

        const parsed = JSON.parse(raw);

        const stored = normalizeStoredPosts(parsed);

        if (!Array.isArray(stored)) {
          if (!cancelled) {
            setPosts(DEMO_POSTS);
          }

          return;
        }
        const migrated = await migratePostsMedia(stored);
        if (cancelled) return;

        setPosts(migrated);
        persistPosts(migrated);
      } catch (error) {
        console.error("Failed to load feed from localStorage:", error);

        if (!cancelled) {
          setPosts(DEMO_POSTS);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    };

    void loadFeed();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!ready) {
      return;
    }

    persistPosts(posts);
  }, [posts, ready]);

  const addPost = useCallback(
    (input: CreateFeedPostInput, author: FeedPost["author"]) => {
      const newPost: FeedPost = {
        id: createLocalPostId(),
        author,
        text: input.text.trim(),
        createdAt: new Date().toISOString(),
        media: input.media ?? [],
        replies: 0,
        reposts: 0,
        likes: 0,
        liked: false,
        reposted: false,
        comments: [],
      };

      setPosts((current) => [newPost, ...current]);

      void migratePostMedia(newPost)
        .then((migratedPost) => {
          if (migratedPost === newPost) {
            return;
          }

          setPosts((current) =>
            current.map((post) =>
              post.id === newPost.id ? migratedPost : post,
            ),
          );
        })
        .catch((error) => {
          console.error("Failed to migrate post media:", error);
        });

      return newPost;
    },
    [],
  );

  const toggleLike = useCallback((postId: string) => {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) {
          return post;
        }

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
        if (post.id !== postId) {
          return post;
        }

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
        if (post.id !== postId) {
          return post;
        }

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
          if (post.id !== postId || !post.comments?.length) {
            return post;
          }

          const result = appendReplyToComment(
            post.comments,
            parentCommentId,
            reply,
          );

          if (!result.changed) {
            return post;
          }

          return {
            ...post,
            replies: post.replies + 1,
            comments: result.comments,
          };
        }),
      );
    },
    [],
  );

  const toggleLikeComment = useCallback((postId: string, commentId: string) => {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId || !post.comments?.length) {
          return post;
        }

        const result = updateCommentTree(
          post.comments,
          commentId,
          (comment) => {
            const nextLiked = !comment.liked;

            return {
              ...comment,
              liked: nextLiked,
              likes: Math.max(0, comment.likes + (nextLiked ? 1 : -1)),
            };
          },
        );

        return result.changed
          ? {
              ...post,
              comments: result.comments,
            }
          : post;
      }),
    );
  }, []);

  const toggleRepostComment = useCallback(
    (postId: string, commentId: string) => {
      setPosts((current) =>
        current.map((post) => {
          if (post.id !== postId || !post.comments?.length) {
            return post;
          }

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

          return result.changed
            ? {
                ...post,
                comments: result.comments,
              }
            : post;
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
