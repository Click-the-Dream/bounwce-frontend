import { FeedPost } from "./types";
import { getRelativeTime } from "./mockFeed";

export const normalizeStoredPosts = (value: unknown): FeedPost[] => {
  if (!Array.isArray(value)) return [];

  return value.filter((post): post is FeedPost => {
    return Boolean(
      post &&
      typeof post === "object" &&
      typeof (post as FeedPost).id === "string" &&
      typeof (post as FeedPost).text === "string" &&
      Array.isArray((post as FeedPost).media),
    );
  });
};

export const getPostDisplayTime = (post: { id: string; createdAt: string }) => {
  const fallback = getRelativeTime(post.createdAt);
  return post.id.startsWith("demo-") ? "2h" : fallback;
};

export const createLocalPostId = () =>
  `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const formatPostTimestamp = (createdAt: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(createdAt));

export const linkifyFeedText = (text: string) => {
  const tokens = text.split(/(\s+)/);

  return tokens.map((token, index) => {
    if (/^#[\p{L}\p{N}_-]+$/u.test(token)) {
      return (
        <span key={`${token}-${index}`} className="text-[#ff4b2b]">
          {token}
        </span>
      );
    }

    if (/^@[\p{L}\p{N}_-]+$/u.test(token)) {
      return (
        <span key={`${token}-${index}`} className="text-[#ff4b2b]">
          {token}
        </span>
      );
    }

    return token;
  });
};
