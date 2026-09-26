import { FeedPost, FeedUser } from "./types";

export const CURRENT_DEMO_USER: FeedUser = {
  id: "demo-current-user",
  fullName: "Victor Example",
  handle: "origamixiii",
  avatar: "/assets/bouwnce-feed/avatar-victor.png",
  verified: true,
};

const jane: FeedUser = {
  id: "demo-jane",
  fullName: "Jane Malik",
  handle: "janemalik",
  avatar: "/assets/bouwnce-feed/avatar-user2.png",
};

const john: FeedUser = {
  id: "demo-john",
  fullName: "John Doe",
  handle: "johndoe",
  avatar: "/assets/bouwnce-feed/avatar-user1.png",
};

const victor: FeedUser = {
  ...CURRENT_DEMO_USER,
};

const originalDropPost: FeedPost = {
  id: "demo-drop-04-original",
  author: victor,
  createdAt: "2026-09-24T14:00:00.000Z",
  text:
    "The Lagos drop is live. 240 pairs, hand-finished, no restock on this colourway.\n\nCart opens 6:00pm WAT — the last one went in 11 minutes. #drop04",
  media: ["/assets/bouwnce-feed/main-post-media.png"],
  replies: 100,
  reposts: 100,
  likes: 100,
  comments: [],
};

export const DEMO_POSTS: FeedPost[] = [
  {
    id: "demo-repost-01",
    author: victor,
    createdAt: "2026-09-24T14:10:00.000Z",
    text: originalDropPost.text,
    media: originalDropPost.media,
    replies: 100,
    reposts: 100,
    likes: 100,
    comments: [
      {
        id: "demo-comment-01",
        author: jane,
        text:
          "The delivery estimate next to the price is the one. We moved ours last month and the support tickets about shipping basically stopped.",
        createdAt: "2026-09-24T15:20:00.000Z",
        likes: 100,
        replies: 2,
        reposts: 4,
        comments: [
          {
            id: "demo-comment-01-reply-01",
            author: john,
            text: "Exactly. The extra friction was hiding in the small details.",
            createdAt: "2026-09-24T16:05:00.000Z",
            likes: 12,
            replies: 1,
            reposts: 1,
            comments: [
              {
                id: "demo-comment-01-reply-01-01",
                author: jane,
                text: "That is what made the conversion jump so quickly.",
                createdAt: "2026-09-24T16:22:00.000Z",
                likes: 5,
              },
            ],
          },
          {
            id: "demo-comment-01-reply-02",
            author: victor,
            text: "We are documenting those changes for the next release.",
            createdAt: "2026-09-24T16:40:00.000Z",
            likes: 8,
          },
        ],
      },
      {
        id: "demo-comment-02",
        author: john,
        text:
          "The delivery estimate next to the price is the one. We moved ours last month and the support tickets about shipping basically stopped.",
        createdAt: "2026-09-24T15:45:00.000Z",
        likes: 100,
      },
    ],
    repostedBy: {
      fullName: "Lorem Ipsum",
      handle: "loremipsum",
      avatar: "/assets/bouwnce-feed/avatar-user1.png",
    },
  },
  {
    id: "demo-text-02",
    author: victor,
    createdAt: "2026-09-24T14:30:00.000Z",
    text:
      "Spent the weekend watching people actually check out on our store instead of guessing.\nRemoved three fields, moved the total @victorexas above the fold, put the delivery estimate next to the price.\n\nCompletion up 18%. The fix is almost never the thing you think it is.",
    media: [],
    replies: 100,
    reposts: 100,
    likes: 100,
    comments: [
      {
        id: "demo-comment-03",
        author: jane,
        text:
          "The delivery estimate next to the price is the one. We moved ours last month and the support tickets about shipping basically stopped.",
        createdAt: "2026-09-24T15:20:00.000Z",
        likes: 100,
      },
      {
        id: "demo-comment-04",
        author: john,
        text:
          "The delivery estimate next to the price is the one. We moved ours last month and the support tickets about shipping basically stopped.",
        createdAt: "2026-09-24T15:45:00.000Z",
        likes: 100,
      },
    ],
  },
  {
    id: "demo-drop-03",
    author: jane,
    createdAt: "2026-09-24T16:10:00.000Z",
    text: "#drop04",
    media: ["/assets/bouwnce-feed/second-post-media.png"],
    replies: 100,
    reposts: 100,
    likes: 100,
    comments: [],
  },
];

export const getRelativeTime = (createdAt: string) => {
  const created = new Date(createdAt).getTime();
  const diff = Math.max(0, Date.now() - created);
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(createdAt));
};
